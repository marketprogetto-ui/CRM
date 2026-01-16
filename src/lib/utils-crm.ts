export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'short',
        timeStyle: 'short',
    }).format(new Date(date));
}

export function getStatusColor(status: string) {
    switch (status.toLowerCase()) {
        case 'pending':
        case 'open':
            return 'bg-blue-900/30 text-blue-400 border-blue-900/50';
        case 'completed':
        case 'won':
        case 'done':
            return 'bg-green-900/30 text-green-400 border-green-900/50';
        case 'lost':
        case 'cancelled':
            return 'bg-red-900/30 text-red-400 border-red-900/50';
        default:
            return 'bg-slate-900/30 text-slate-400 border-slate-900/50';
    }
}
