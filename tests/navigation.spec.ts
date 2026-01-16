import { test, expect } from '@playwright/test';

test.describe('Navegabilidade Básica', () => {
    test('deve carregar a página de login', async ({ page }) => {
        await page.goto('/login');
        await expect(page).toHaveURL(/.*login/);
        // Verifica o título do Card que contém "CRM"
        await expect(page.locator('[data-slot="card-title"]')).toContainText(/CRM/i);
    });

    test('deve redirecionar para login ao tentar acessar o dashboard sem autenticação', async ({ page }) => {
        const protectedRoutes = [
            '/pipeline/commercial',
            '/pipeline/delivery',
            '/reports',
            '/activities'
        ];

        for (const route of protectedRoutes) {
            await page.goto(route);
            await expect(page).toHaveURL(/.*login/);
        }
    });

    test('deve verificar a estrutura da página de login', async ({ page }) => {
        await page.goto('/login');

        // Verifica se há campos de e-mail e senha
        await expect(page.locator('input[id="email"]')).toBeVisible();
        await expect(page.locator('input[id="password"]')).toBeVisible();

        // Verifica se há o botão de entrar
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });
});
