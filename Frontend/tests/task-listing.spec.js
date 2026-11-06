import { expect, test } from '@playwright/test'

const apiRoute = 'http://localhost:3000/tasks**'

function makeTasks() {
  return Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    title: `Task ${index + 1}`,
    completed: index % 2 === 0,
    created_at: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
  }))
}

async function respondWithTasks(route, tasks, totalCount = tasks.length) {
  const url = new URL(route.request().url())
  const page = Number(url.searchParams.get('page'))
  const offset = Number(url.searchParams.get('offset'))
  const start = (page - 1) * offset
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      data: tasks.slice(start, start + offset),
      meta: { page, offset, totalCount },
    }),
  })
}

test('loads five tasks and navigates numbered server pages', async ({ page }) => {
  const requests = []
  const tasks = makeTasks()
  await page.route(apiRoute, async (route) => {
    const url = new URL(route.request().url())
    requests.push(url)
    await respondWithTasks(route, tasks, tasks.length)
  })

  await page.goto('/')
  await expect(page.getByRole('row')).toHaveCount(6)
  await expect(page.getByText('Page 1 of 3')).toBeVisible()
  expect(requests[0].searchParams.get('page')).toBe('1')
  expect(requests[0].searchParams.get('offset')).toBe('5')
  expect(requests[0].searchParams.get('sortBy')).toBe('created_at')
  expect(requests[0].searchParams.get('order')).toBe('DESC')

  await page.getByRole('button', { name: 'Page 2' }).click()
  await expect(page.getByText('Page 2 of 3')).toBeVisible()
  await expect(page.getByRole('cell', { name: '6', exact: true })).toBeVisible()
  expect(requests.at(-1).searchParams.get('page')).toBe('2')

  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page.getByText('Page 3 of 3')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Previous' })).toBeEnabled()
})

test('applies combined filters and resets sorting to page one', async ({ page }) => {
  const requests = []
  await page.route(apiRoute, async (route) => {
    const url = new URL(route.request().url())
    requests.push(url)
    const title = url.searchParams.get('title')
    const completed = url.searchParams.get('completed')
    if (title === 'Node') {
      if (completed === 'true') {
        await respondWithTasks(route, [], 0)
        return
      }
      await respondWithTasks(
        route,
        [{ id: 8, title: 'Node guide', completed: false, created_at: '2026-03-01T10:00:00Z' }],
        1,
      )
      return
    }
    if (title === 'Task' && completed === 'false') {
      const filteredTasks = Array.from({ length: 6 }, (_, index) => ({
        id: index + 20,
        title: `Task match ${index + 1}`,
        completed: false,
        created_at: '2026-03-01T10:00:00Z',
      }))
      await respondWithTasks(route, filteredTasks, filteredTasks.length)
      return
    }
    await respondWithTasks(route, makeTasks(), 12)
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Page 2' }).click()
  await expect(page.getByText('Page 2 of 3')).toBeVisible()
  await page.getByRole('button', { name: 'ID', exact: true }).click()
  await expect(page.getByText('Page 1 of 3')).toBeVisible()
  expect(requests.at(-1).searchParams.get('sortBy')).toBe('id')
  expect(requests.at(-1).searchParams.get('order')).toBe('ASC')

  await page.getByRole('searchbox', { name: 'Title' }).fill('Node')
  await page.getByLabel('Completion').selectOption('false')
  await page.getByRole('button', { name: 'Apply' }).click()

  await expect(page.getByRole('row').filter({ hasText: 'Node guide' })).toBeVisible()
  await expect(page.getByText('Page 1 of 1')).toBeVisible()
  expect(requests.at(-1).searchParams.get('page')).toBe('1')
  expect(requests.at(-1).searchParams.get('title')).toBe('Node')
  expect(requests.at(-1).searchParams.get('completed')).toBe('false')

  await page.getByRole('button', { name: 'ID', exact: true }).click()
  await expect.poll(() => requests.at(-1).searchParams.get('order')).toBe('DESC')
  await page.getByRole('button', { name: 'ID', exact: true }).click()
  await expect.poll(() => requests.at(-1).searchParams.get('order')).toBe('ASC')

  await page.getByLabel('Completion').selectOption('true')
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByRole('heading', { name: 'No matching tasks' })).toBeVisible()
  expect(requests.at(-1).searchParams.get('completed')).toBe('true')

  await page.getByRole('button', { name: 'Clear filters' }).click()
  await expect(page.getByRole('row')).toHaveCount(6)
  expect(requests.at(-1).searchParams.has('title')).toBe(false)
  expect(requests.at(-1).searchParams.has('completed')).toBe(false)

  await page.getByRole('searchbox', { name: 'Title' }).fill('Task')
  await page.getByLabel('Completion').selectOption('false')
  await page.getByRole('button', { name: 'Apply' }).click()
  await expect(page.getByText('Page 1 of 2')).toBeVisible()
  await page.getByRole('button', { name: 'Page 2' }).click()
  await expect(page.getByText('Page 2 of 2')).toBeVisible()
  expect(requests.at(-1).searchParams.get('title')).toBe('Task')
  expect(requests.at(-1).searchParams.get('completed')).toBe('false')

  await page.getByRole('button', { name: 'Clear', exact: true }).click()
  await expect(page.getByText('Page 1 of 3')).toBeVisible()
})

test('shows a retryable error and distinguishes an empty list', async ({ page }) => {
  let requestCount = 0
  let shouldFail = true
  await page.route(apiRoute, async (route) => {
    requestCount += 1
    if (shouldFail) {
      await route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Service unavailable' }),
      })
      return
    }
    await respondWithTasks(route, [], 0)
  })

  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Service unavailable')
  shouldFail = false
  await page.getByRole('button', { name: 'Retry' }).click()
  await expect(page.getByRole('heading', { name: 'No tasks yet' })).toBeVisible()
  expect(requestCount).toBeGreaterThanOrEqual(2)
})

test('keeps the table horizontally scrollable beside the sidebar on narrow screens', async ({ page }) => {
  await page.route(apiRoute, async (route) => {
    await respondWithTasks(route, makeTasks(), 12)
  })
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')

  const tableRegion = page.getByRole('region', { name: 'Task results' })
  await expect(tableRegion).toBeVisible()
  await expect(page.getByRole('complementary')).toBeVisible()
  const dimensions = await tableRegion.evaluate((element) => ({
    scrollWidth: element.scrollWidth,
    clientWidth: element.clientWidth,
  }))
  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth)
})
