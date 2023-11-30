import {Pinecone, PineconeClient, Vector, utils as PineconeUtils, PineconeRecord} from "@pinecone-database/pinecone"
import { downloadFromS3 } from "./s3-server";
import {PDFLoader} from "langchain/document_loaders/fs/pdf"
import {Document, RecursiveCharacterTextSplitter} from "@pinecone-database/doc-splitter"
import { getEmbeddings } from "./embeddings";
import md5 from "md5"
import { convertToAscii } from "./utils";

let pinecone : Pinecone| null = null;

export const getPineconeClient = async()=>{
   if(!pinecone){
     pinecone = new Pinecone({
        apiKey: process.env.NEXT_PUBLIC_PINECONE_SECRET_KEY!,
        environment: process.env.NEXT_PUBLIC_PINECONE_ENVIRONMENT!,
      });
   }
   return pinecone
}

type PDFPage = {
  pageContent : string,
  metadata: {
    loc : {pageNumber : number}
  }
}

export async function loadS3IntoPinecone(filekey:string) {
  // 1. Obtain the PDF and download and read from pdf
    const file_name = await downloadFromS3(filekey)
    if(!file_name){
        throw new Error("Could not download from S3")
    }
    const loader = new PDFLoader(file_name)
    const pages = (await loader.load()) as PDFPage[]

    // Split and segment the PDF

    const documents = await Promise.all(pages.map(prepareDocument))

    // vectorise and embed the individual documents 
    const vectors = await Promise.all(documents.flat().map(embedDocument))

    // upload to Pinecone DB
    const client = await getPineconeClient()
    const pineconeIndex = client.Index("chatpdf-yt")
    console.log("inserting vectors into pinecone")
    const namespace= convertToAscii(filekey) ;
    pineconeIndex.upsert(vectors);
    // PineconeUtils.chunkedUpsert(pineconeIndex, vectors, namespace, 10)

    // return pages;
    return documents[0]
}

async function embedDocument(doc:Document) {
  try {
    // converting the page content into vector 
    const embeddings = await getEmbeddings(doc.pageContent)
    const hash = md5(doc.pageContent)
    return{
      id: hash,
      values: embeddings,
      metadata:{
        pageNumber:doc.metadata.pageNumber,
        text : doc.metadata.text
      }
    } as PineconeRecord;
  } catch (error) {
    console.log("error during embedding document", error)
    throw error
  }
  
}

export const truncateStringByBytes=(str : string, bytes : number)=>{
  const enc = new TextEncoder()
  return new TextDecoder("utf-8").decode(enc.encode(str).slice(0,bytes))
}

async function prepareDocument(pages:PDFPage) {
  let {pageContent, metadata} = pages;
  pageContent= pageContent.replace(/\n/g, "")

  // split the document
  const splitter = new RecursiveCharacterTextSplitter()
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent, 
      metadata :{
        pageNumber : metadata.loc.pageNumber,
        text : truncateStringByBytes(pageContent,36000)
      }
    })
  ])
  return docs;
}