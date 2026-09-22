import { test, expect } from '@playwright/test';

test.describe('Flujo Crítico de Pase de Lista por Escáner QR', () => {
  test.beforeEach(async ({ page }) => {
    // 1. Interceptar endpoint de asistencia para pruebas deterministas
    await page.route('**/api/v1/attendance/scan', async (route) => {
      const requestPayload = JSON.parse(route.request().postData() || '{}');

      if (requestPayload.qrCode === 'STUDENT_VALID_A01') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            status: 'PRESENT',
            student: {
              id: 'std_01',
              fullName: 'García López, Juan Carlos',
              enrollmentNumber: 'A01234567',
            },
            timestamp: new Date().toISOString(),
          }),
        });
      }

      return route.fulfill({
        status: 404,
        body: JSON.stringify({ error: 'ALUMNO_NO_ENCONTRADO' }),
      });
    });

    // 2. Mock de la conexión WebSocket para evitar fallos de transporte en CI
    await page.route('**/socket.io/**', (route) => route.abort());
  });

  test('Profesor inicia sesión, escanea credencial física y visualiza confirmación', async ({ page }) => {
    // A. Mock de sesión autenticada en localStorage
    await page.goto('/login');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock_jwt_teacher_valid');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: 'prof_1',
          email: 'profesor@iteso.mx',
          role: 'TEACHER',
          teacherId: 'teacher_mock_id',
        })
      );
    });

    // B. Navegación directa a la vista de escáner
    await page.goto('/scanner');
    await page.waitForLoadState('domcontentloaded');

    // C. Localizar el input de la credencial USB
    const usbInput = page.getByPlaceholder(/Esperando lectura de credencial/i);
    await expect(usbInput).toBeVisible({ timeout: 10000 });

    // D. Simular lectura instantánea de la pistola USB rematada con 'Enter'
    await usbInput.fill('STUDENT_VALID_A01');
    await usbInput.press('Enter');

    // E. Aserción de confirmación en la UI
    const statusText = page.locator('text=/PRESENTE|sincronizado|éxito/i');
    await expect(statusText.first()).toBeVisible({ timeout: 5000 });
  });
});
