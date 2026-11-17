"""Build a local Chroma index from coffee pest manuals in ./documents."""
import os
from pathlib import Path

from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

BASE = Path(__file__).resolve().parent
DOCUMENTS = Path(os.environ.get("RAG_DOCUMENTS", BASE / "documents"))
CHROMA = Path(os.environ.get("CHROMA_PATH", BASE / "chroma"))

def main() -> None:
    if not DOCUMENTS.is_dir():
        raise SystemExit(f"Create {DOCUMENTS} and add trusted PDF manuals first.")
    documents = PyPDFDirectoryLoader(str(DOCUMENTS)).load()
    if not documents:
        raise SystemExit("No PDF pages were found; the index was not changed.")
    chunks = RecursiveCharacterTextSplitter(chunk_size=900, chunk_overlap=150).split_documents(documents)
    Chroma.from_documents(
        chunks,
        HuggingFaceEmbeddings(model_name=os.environ.get("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")),
        persist_directory=str(CHROMA),
    )
    print(f"Indexed {len(chunks)} chunks from {len(documents)} PDF pages into {CHROMA}")

if __name__ == "__main__":
    main()
