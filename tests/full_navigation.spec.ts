import { test, expect } from '@playwright/test';

test.describe('Navegabilidade da Plataforma', () => {

    test('deve navegar por todas as rotas principais sem erro', async ({ page }) => {
        const routes = [
            { path: '/pipeline/commercial', title: 'Pipeline commercial' },
            { path: '/pipeline/delivery', title: 'Pipeline delivery' },
            { path: '/activities', title: 'Todas as Atividades' },
            { path: '/reports', title: 'Intelligence & Analytics' }
        ];

        for (const route of routes) {
            console.log(`Testando rota: ${route.path}`);
            await page.goto(route.path);

            // Verifica se não deu erro 500 ou página branca
            await expect(page.locator('body')).not.toContainText(/Internal Server Error|Error 500/i);

            // Verifica se a Sidebar está presente (usando o slot ou o texto do logo)
            await expect(page.getByText('Progetto')).toBeVisible();
            await expect(page.locator('[data-sidebar="sidebar"]')).toBeVisible();

            // Verifica se o conteúdo esperado da página carregou (mesmo que vazio)
            await expect(page.getByText(route.title, { exact: false })).toBeVisible();
        }
    });

    test('deve redirecionar da home para o pipeline comercial', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveURL(/.*pipeline\/commercial/);
    });

    test('deve lidar com oportunidade não encontrada graciosamente', async ({ page }) => {
        await page.goto('/opportunities/test-id-123');
        await expect(page.getByText(/Oportunidade não encontrada/i)).toBeVisible();
    });
});
