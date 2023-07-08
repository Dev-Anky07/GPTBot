from langchain.document_loaders import UnstructuredPDFLoader, OnlinePDFLoader, PyPDFLoader

from langchain.text_splitter import RecursiveCharacterTextSplitter
import os

loader = PyPDFLoader("/workspace/Apecoin.pdf")
data = loader.load()

# Note: If you're using PyPDFLoader then it will split by page for you already
print (f'You have {len(data)} document(s) in your data')
print (f'There are {len(data[30].page_content)} characters in your document')

# Note: If you're using PyPDFLoader then we'll be splitting for the 2nd time.

text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
texts = text_splitter.split_documents(data)

print (f'Now you have {len(texts)} documents')

from langchain.vectorstores import Pinecone
from langchain.embeddings.openai import OpenAIEmbeddings
import pinecone

# Change this to environmental variables
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', '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')

PINECONE_API_KEY = os.environ.get('PINECONE_API_KEY', 'efc11ab0-ffad-4d0c-87a2-1616c42d31a0')
PINECONE_API_ENV = os.environ.get('PINECONE_API_ENV', 'asia-southeast1-gcp-free')

embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)

# initialize pinecone
pinecone.init(
    api_key="efc11ab0-ffad-4d0c-87a2-1616c42d31a0",  # find at app.pinecone.io
    environment="asia-southeast1-gcp-free"  # next to api key in console
)
index_name = "ape" # Ape Assistant

docsearch = Pinecone.from_texts([t.page_content for t in texts], embeddings, index_name=index_name)

query = "What's AIP 239?"
docs = docsearch.similarity_search(query)

# Here's an example of the first document that was returned
print(docs[0].page_content[:450])

from langchain.llms import OpenAI
from langchain.chains.question_answering import load_qa_chain

llm = OpenAI(temperature=0.1, openai_api_key="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")
chain = load_qa_chain(llm, chain_type="stuff")

query = "What is the Ape Assembly?"
docs = docsearch.similarity_search(query)

chain.run(input_documents=docs, question=query)