import {Pinecone, PineconeClient} from "@pinecone-database/pinecone"
import { downloadFromS3 } from "./s3-server";
import {PDFLoader} from "langchain/document_loaders/fs/pdf"

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

export async function loadS3IntoPinecone(filekey:string) {
    const file_name = await downloadFromS3(filekey)
    if(!file_name){
        throw new Error("Could not download from S3")
    }
    const loader = new PDFLoader(file_name)
    const pages = await loader.load()

    return pages;
}