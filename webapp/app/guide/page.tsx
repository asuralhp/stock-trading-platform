import { fetchData, Post } from '../api/data';
import ChatSlot from '../components/ChatSlot';



export default async function Guide()  {
    const posts: Post[] = await fetchData();

    return (
        <div>
            <h1>Guide</h1>
        </div>
    );
}

