import AWS from "aws-sdk";
export async function uploadToS3(file:File) {
    try {
        
        AWS.config.update({
            accessKeyId: process.env.NEXT_PUBLIC_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.NEXT_PUBLIC_S3_SECRET_ACCESS_KEY
        })
        const s3 = new AWS.S3({
            params:{
                Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME
            },
            region: process.env.NEXT_PUBLIC_S3_BUCKET_REGION
        })

        // unique naming for file key to uploading into s3 bucket
 
        const file_key = "uploads/" + Date.now().toString() + file.name.replace(" ", "_")

        const params = {
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Key : file_key,
            Body : file
        }
        const upload = s3.putObject(params).on("httpUploadProgress", evt=>{
            console.log("file uploading to S3...", parseInt((evt.loaded * 100) / evt.total).toString() + "%");
            
        }).promise()

        await upload.then(data =>{
            console.log("file uploaded successfully", file_key)
        })

        return Promise.resolve({
            file_key,
            file_name:file.name
        })



    } catch (error) {
        console.log(error)
    }
    
}

export function getS3Url(file_key:String){
    const url = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_S3_BUCKET_REGION}.amazonaws.com/${file_key}`
    return url
}