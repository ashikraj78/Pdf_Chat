import { getEmbeddings } from "./embeddings";
import { getPineconeClient } from "./pinecone";
import { convertToAscii } from "./utils";

export async function getMatchesFromEmbeddings({ embeddings, fileKey }: { embeddings: number[]; fileKey: string; }) {
  const pinecone = await getPineconeClient();
  const index = await pinecone.Index("chatpdf-yt");
  try {
    const namespace= convertToAscii(fileKey) ;
    const queryResult = await index.query({
        topK:5,
        vector: embeddings,
        includeMetadata:true,
    })
    return queryResult.matches || []
      
  } catch (error) {
      console.log("error querrying embedding", error)
      throw error
  }
}




export async function getContext({ query, fileKey }: { query: string; fileKey: string; }){

    const queryEmbeddings = await getEmbeddings(query);
    const matches = await getMatchesFromEmbeddings({ embeddings: queryEmbeddings, fileKey: fileKey })
    const qualifyingDocs = matches.filter((match)=> match.score && match.score > 0.7)
    type Metadata = {
        text : string,
        pageNumber: number
    }
    let docs = qualifyingDocs.map(match => (match.metadata as Metadata).text)

    return docs.join('\n').substring(0,3000)

}