// api for creating chat 

import { db } from "@/lib/db"
import { getS3Url } from "@/lib/db/s3"
import { chats } from "@/lib/db/schema"
import { loadS3IntoPinecone } from "@/lib/pinecone"
import { NextResponse } from "next/server"
import {auth} from "@clerk/nextjs"

export async function POST(req :Request, res:Response) {
    const {userId} = await auth()
    if(!userId){
        return NextResponse.json({error: "unauthorize"}, {status:401})
    }
    try {
        const body = await req.json()
        const {file_key, file_name} = body
        console.log(file_key, file_name, "file key and file name")

        await loadS3IntoPinecone(file_key)
        const chat_id = await db.insert(chats).values({
            fileKey: file_key,
            pdfName:file_name,
            pdfUrl: getS3Url(file_key),
            userId

        }).returning({insertedId: chats.id})
        return NextResponse.json({chat_id: chat_id[0].insertedId}, {status: 200})

    } catch (error) {
        console.error(error)
        return NextResponse.json({error:"Internal Server Error"}, {status:500})
    }
}

