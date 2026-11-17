import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../context/useAuth";
import { useLanguage } from "../context/LanguageContext";

type HelpCategory = "bctb_signs" | "pruning" | "shade" | "weather";
interface HelpQuestion {
  id: string;
  farmerId: string;
  farmerName: string;
  district?: string;
  subCounty?: string;
  category: HelpCategory;
  title: string;
  message: string;
  lastMessage?: string;
  lastMessageAt?: number;
  createdAt: number;
}
interface HelpReply {
  id: string;
  responderId: string;
  responderName: string;
  responderRole: string;
  message: string;
  createdAt: number;
}

const STAFF_ROLES = ["AGRICULTURAL_OFFICER", "FARM_MANAGER", "ORG_ADMIN", "PLATFORM_ADMIN"];
const CATEGORY_KEYS = {
  bctb_signs: "filterBctbSigns",
  pruning: "filterPruning",
  shade: "filterShade",
  weather: "filterWeather",
} as const;

export default function HelpRoomPage() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const isFarmer = profile?.role === "FARMER";
  const isSupport = Boolean(profile && STAFF_ROLES.includes(profile.role));
  const [questions, setQuestions] = useState<HelpQuestion[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [replies, setReplies] = useState<HelpReply[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<HelpCategory | "all">("all");
  const [category, setCategory] = useState<HelpCategory>("bctb_signs");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [replyText, setReplyText] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [mobileThread, setMobileThread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || (!isFarmer && !isSupport)) {
      setQuestions([]);
      setSelectedId("");
      return;
    }
    const base = collection(db, "helpQuestions");
    const inboxQuery = query(base, orderBy("createdAt", "desc"), limit(100));

    return onSnapshot(
      inboxQuery,
      (snapshot) => {
        const next = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }) as HelpQuestion)
          .sort((a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt));
        setQuestions(next);
        setSelectedId((current) => current && next.some((item) => item.id === current) ? current : next[0]?.id || "");
        setError("");
      },
      (cause) => {
        console.error("Help room listener failed:", cause);
        setError(t.helpRoomError);
      },
    );
  }, [user, isFarmer, isSupport, t.helpRoomError]);

  useEffect(() => {
    if (!selectedId) {
      setReplies([]);
      return;
    }
    return onSnapshot(
      query(collection(db, "helpQuestions", selectedId, "replies"), orderBy("createdAt", "asc")),
      (snapshot) => setReplies(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as HelpReply)),
      (cause) => {
        console.error("Help room messages listener failed:", cause);
        setError(t.helpReplyError);
      },
    );
  }, [selectedId, t.helpReplyError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [selectedId, replies]);

  const selected = questions.find((item) => item.id === selectedId) || null;
  const visibleQuestions = useMemo(
    () => (categoryFilter === "all" ? questions : questions.filter((item) => item.category === categoryFilter))
      .sort((a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt)),
    [questions, categoryFilter],
  );
  const canReply = Boolean(user && profile && selected && (
    selected.farmerId === user.uid || STAFF_ROLES.includes(profile.role)
  ));

  async function postQuestion(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;
    if (!user || !profile) {
      setError("Your sign-in or farmer profile has not finished loading. Please refresh and try again.");
      return;
    }
    if (!isFarmer) {
      setError("Only farmer accounts can post a new question.");
      return;
    }
    if (!title.trim() || !message.trim()) {
      setError("Add a question title and describe what is happening on your farm.");
      return;
    }
    setSending(true);
    setError("");
    try {
      const firstMessage = message.trim().slice(0, 3000);
      const createdAt = Date.now();
      const posted = await addDoc(collection(db, "helpQuestions"), {
        farmerId: user.uid,
        farmerName: profile.fullName,
        district: profile.assignedDistrict || "",
        subCounty: profile.assignedSubCounty || "",
        category,
        title: title.trim().slice(0, 140),
        message: firstMessage,
        lastMessage: firstMessage,
        createdAt,
        lastMessageAt: createdAt,
      });
      setTitle("");
      setMessage("");
      setSelectedId(posted.id);
      setMobileThread(true);
      setShowNewConversation(false);
    } catch (cause) {
      console.error("Could not start help conversation:", cause);
      const code = cause && typeof cause === "object" && "code" in cause
        ? String((cause as { code: unknown }).code)
        : "";
      setError(code === "permission-denied"
        ? "Firestore blocked this question. Deploy the latest rules with `firebase deploy --only firestore:rules`, then try again."
        : `${t.helpPostError}${code ? ` (${code})` : ""}`);
    } finally {
      setSending(false);
    }
  }

  async function postReply(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !profile || !selected || !replyText.trim() || !canReply || sending) return;
    setSending(true);
    setError("");
    try {
      const body = replyText.trim().slice(0, 3000);
      const sentAt = Date.now();
      const batch = writeBatch(db);
      const messageRef = doc(collection(db, "helpQuestions", selected.id, "replies"));
      batch.set(messageRef, {
        responderId: user.uid,
        responderName: profile.fullName,
        responderRole: profile.role,
        message: body,
        createdAt: sentAt,
      });
      batch.update(doc(db, "helpQuestions", selected.id), {
        lastMessage: body,
        lastMessageAt: sentAt,
      });
      await batch.commit();
      setReplyText("");
    } catch (cause) {
      console.error("Could not send help room message:", cause);
      setError(t.helpPostError);
    } finally {
      setSending(false);
    }
  }

  function handleReplyKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const formatTime = (time: number) => new Date(time).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  const formatShortTime = (time: number) => new Date(time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <section className="help-room-page">
      <header className="help-room-intro panel">
        <div className="help-room-title-row"><div><span className="section-kicker">{t.helpRoom}</span><h2>{t.helpIntroTitle}</h2><p>{t.helpIntroText}</p></div><div className="help-live-status"><span /> {t.helpLiveDiscussions}</div></div>
        <div className="topic-filter-bar" role="group" aria-label={t.helpAllTopics}>
          <button type="button" className={`topic-chip ${categoryFilter === "all" ? "active" : ""}`} onClick={() => setCategoryFilter("all")}>{t.helpAllTopics}</button>
          {Object.entries(CATEGORY_KEYS).map(([id, key]) => <button key={id} type="button" className={`topic-chip ${categoryFilter === id ? "active" : ""}`} onClick={() => setCategoryFilter(id as HelpCategory)}>{t[key]}</button>)}
        </div>
      </header>

      {error && !showNewConversation && <p className="form-error" role="alert">{error}</p>}

      <div className="help-room-layout">
        <aside className={`panel help-question-list ${mobileThread ? "mobile-hidden" : ""}`}>
          <div className="help-inbox-heading"><div><span className="section-kicker">{t.helpLiveDiscussions}</span><h3>{isSupport ? "Farmer conversations" : t.helpQuestions}</h3></div><span className="help-room-count">{visibleQuestions.length}</span></div>
          {isFarmer && <button className="help-new-chat-button" type="button" onClick={() => setShowNewConversation(true)}><span aria-hidden="true">＋</span> {t.helpAskOfficer}</button>}
          <div className="help-conversation-list">
            {visibleQuestions.length === 0 ? <div className="help-inbox-empty"><span aria-hidden="true">💬</span><p>{t.helpNoQuestions}</p>{isFarmer && <button type="button" className="primary-button" onClick={() => setShowNewConversation(true)}>{t.helpStartConversation}</button>}</div> : visibleQuestions.map((item) => {
              const lastMessageAt = item.lastMessageAt ?? item.createdAt;
              return <button key={item.id} type="button" className={`help-question-item ${selectedId === item.id ? "selected" : ""}`} onClick={() => { setSelectedId(item.id); setMobileThread(true); }}>
                <span className="help-list-avatar" aria-hidden="true">{item.farmerName.slice(0, 1).toUpperCase()}</span>
                <span className="help-list-copy"><span className="help-list-top"><strong>{item.farmerName}</strong><time>{formatShortTime(lastMessageAt)}</time></span><span className="help-list-subject">{item.title}</span><span className="help-list-preview">{item.lastMessage || item.message}</span><small>{[item.subCounty, item.district].filter(Boolean).join(", ") || t.helpUganda} · {t[CATEGORY_KEYS[item.category]] || t.helpCoffeeSupport}</small></span>
              </button>;
            })}
          </div>
        </aside>

        <section className={`panel help-thread ${mobileThread ? "mobile-visible" : "mobile-hidden"}`}>
          {selected ? <>
            <header className="help-thread-heading">
              <button className="help-mobile-back" type="button" onClick={() => setMobileThread(false)} aria-label="Back to conversations">‹</button>
              <span className="help-thread-avatar" aria-hidden="true">{selected.farmerName.slice(0, 1).toUpperCase()}</span>
              <div className="help-thread-person"><h3>{selected.farmerName}</h3><p>{[selected.subCounty, selected.district].filter(Boolean).join(", ") || t.helpUganda} · {t[CATEGORY_KEYS[selected.category]] || t.helpCoffeeSupport}</p></div>
              <span className="help-thread-live"><i /> {t.helpLiveDiscussions}</span>
            </header>
            <div className="help-thread-topic"><strong>{selected.title}</strong><span>{t[CATEGORY_KEYS[selected.category]] || t.helpCoffeeSupport} · {formatTime(selected.createdAt)}</span></div>
            <div className="help-thread-messages" aria-live="polite">
              <div className="help-date-divider"><span>{formatTime(selected.createdAt)}</span></div>
              <article className={`help-post ${selected.farmerId === user?.uid ? "outgoing" : "incoming"}`}>
                <p>{selected.message}</p><time>{formatShortTime(selected.createdAt)}</time>
              </article>
              {replies.map((reply) => <article key={reply.id} className={`help-post ${reply.responderId === user?.uid ? "outgoing" : "incoming"}`}>
                {reply.responderId !== user?.uid && <strong>{reply.responderName} <small>{reply.responderRole.replace(/_/g, " ")}</small></strong>}
                <p>{reply.message}</p><time>{formatShortTime(reply.createdAt)}</time>
              </article>)}
              {replies.length === 0 && <p className="help-waiting-note">{t.helpWaitingReply}</p>}
              <div ref={messagesEndRef} />
            </div>
            {canReply ? <form className="help-reply-form" onSubmit={postReply}><textarea aria-label={t.helpReplyPlaceholder} rows={1} maxLength={3000} value={replyText} placeholder={t.helpReplyPlaceholder} onChange={(event) => setReplyText(event.target.value)} onKeyDown={handleReplyKeyDown} required /><span>Enter to send · Shift + Enter for a new line</span><button className="help-send-button" type="submit" disabled={sending || !replyText.trim()} aria-label={sending ? t.helpSending : t.helpSendReply}>{sending ? <span className="help-send-spinner" /> : <span aria-hidden="true">➤</span>}</button></form> : <p className="help-empty">{t.helpReplyOnly}</p>}
          </> : <div className="help-chat-empty"><span aria-hidden="true">🌱</span><h3>{t.helpChooseQuestion}</h3><p>Choose a conversation on the left to read messages and get support.</p></div>}
        </section>
      </div>

      {showNewConversation && isFarmer && <div className="help-new-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowNewConversation(false); }}>
        <form className="panel help-ask-form" onSubmit={postQuestion} role="dialog" aria-modal="true" aria-labelledby="help-new-title">
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="help-new-heading"><span className="help-thread-avatar" aria-hidden="true">✉</span><div><span className="section-kicker">{t.helpAskOfficer}</span><h3 id="help-new-title">{t.helpStartConversation}</h3></div><button type="button" className="help-close-button" onClick={() => setShowNewConversation(false)} aria-label="Close">×</button></div>
          <label htmlFor="help-category">{t.helpTopic}</label><select id="help-category" value={category} onChange={(event) => setCategory(event.target.value as HelpCategory)}>{Object.entries(CATEGORY_KEYS).map(([id, key]) => <option key={id} value={id}>{t[key]}</option>)}</select>
          <label htmlFor="help-title">{t.helpQuestionTitle}</label><input id="help-title" value={title} placeholder={t.helpQuestionPlaceholder} onChange={(event) => setTitle(event.target.value)} maxLength={140} required />
          <label htmlFor="help-message">{t.helpDescribe}</label><textarea id="help-message" value={message} placeholder={t.helpMessagePlaceholder} onChange={(event) => setMessage(event.target.value)} rows={5} maxLength={3000} required />
          <div className="help-private-note"><span aria-hidden="true">🌍</span> Farmers and agricultural officers can see this question and its replies.</div>
          <div className="help-new-actions"><button className="outline-button" type="button" onClick={() => setShowNewConversation(false)}>Cancel</button><button className="primary-button" type="submit" disabled={sending || !title.trim() || !message.trim()}>{sending ? t.helpPosting : t.helpSendQuestion}</button></div>
        </form>
      </div>}
    </section>
  );
}
