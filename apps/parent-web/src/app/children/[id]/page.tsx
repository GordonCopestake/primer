export default function ChildDetailPage({ params }: { params: { id: string } }) {
  return <main>Child detail: {params.id}</main>;
}
