import { fetchData, Post } from '../api/data';



export default async function Contact()  {
    const posts: Post[] = await fetchData();

    return (
        <div>
            <h1>Posts</h1>
            <ul>
                {posts.map(post => (
                    <li key={post.id}>
                        <h1>Title : {post.title}</h1>
                        <p>{post.body}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}

