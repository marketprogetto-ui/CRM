import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white">
            <h2 className="text-4xl font-bold mb-4">Página não encontrada</h2>
            <p className="text-slate-400 mb-8">Não conseguimos encontrar o recurso solicitado.</p>
            <Link href="/" className="px-4 py-2 bg-indigo-600 rounded hover:bg-indigo-500 transition-colors">
                Voltar ao início
            </Link>
        </div>
    )
}
