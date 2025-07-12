"use server"
export interface Post {
    id: number;
    title: string;
    body: string;
}

export async function fetchData(): Promise<Post[]> {
    const response = await fetch('https://jsonplaceholder.typicode.com/posts');
    if (!response.ok) {
        throw new Error('Failed to fetch data');
    }
    const data: Post[] = await response.json();
    return data;
}