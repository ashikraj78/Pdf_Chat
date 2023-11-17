// api for creating chat 

import { NextResponse } from "next/server"

export async function POST(req :Request, res:Response) {
    try {
        const body = await req.json()
        const {file_key, file_name} = body
        console.log(file_key, file_name, "file key and file name")
        return NextResponse.json({message: "Success"})
    } catch (error) {
        console.error(error)
        return NextResponse.json({error:"Internal Server Error"}, {status:500})
    }
}