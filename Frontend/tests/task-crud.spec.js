import { expect, test } from '@playwright/test'

function makeTasks(count = 12) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    title: `Task ${index + 1}`,
    completed: index % 2 === 0,
    created_at: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
  }))
}

async function respondWithTasks(route, tasks) {
  const url = new URL(route.request().url())
  const page = Number(url.searchParams.get('page'))
  const offset = Number(url.searchParams.get('offset'))
  const title = url.searchParams.get('title')?.toLocaleLowerCase()
  const completed = url.searchParams.get('completed')
  const filteredTasks = tasks.filter((task) => {
    const matchesTitle = !title || task.title.toLocaleLowerCase().includes(title)
    const matchesCompleted = completed === null || String(task.completed) === completed
    return matchesTitle && matchesCompleted
  })
  const start = (page - 1) * offset

  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      success: true,
      data: filteredTasks.slice(start, start + offset),
      meta: { page, offset, totalCount: filteredTasks.length },
    }),
  })
}

test('creates tasks through the API and clears filters before refreshing the list', async ({ page }) => {
  const tasks = makeTasks()
  const listRequests = []
  let createRequest
  let createRequestCount = 0
  let releaseCreate
  await page.route('http://localhost:3000/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (request.method() === 'GET' && url.pathname === '/tasks') {
      listRequests.push(url)
      await respondWithTasks(route, tasks)
      return
    }
    if (request.method() === 'POST' && url.pathname === '/addTask') {
      createRequestCount += 1
      createRequest = request
      await new Promise((resolve) => {
        releaseCreate = resolve
      })
      const task = {
        id: 99,
        title: request.postDataJSON().title,
        completed: false,
        created_at: new Date().toISOString(),
      }
      tasks.unshift(task)
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: task }),
      })
      return
    }
    await route.continue()
  })

  await page.goto('/')
  await page.getByRole('searchbox', { name: 'Title' }).fill('Task')
  await page.getByLabel('Completion').selectOption('false')
  await page.getByRole('button', { name: 'Apply' }).click()
  await page.getByRole('button', { name: 'Page 2' }).click()
  await page.getByRole('button', { name: 'Create task' }).first().click()
  await page.getByLabel('Task title').fill('  New task  ')
  await page.getByRole('button', { name: 'Create task' }).last().click()

  const createButton = page.getByRole('button', { name: 'Creating…' })
  await expect(createButton).toBeDisabled()
  expect(createRequestCount).toBe(1)
  releaseCreate()
  await expect.poll(() => createRequest?.postDataJSON()).toEqual({ title: 'New task' })
  await expect(page.getByRole('row').filter({ hasText: 'New task' })).toBeVisible()
  await expect(page.getByText('Page 1 of 3')).toBeVisible()

  const params = listRequests.at(-1).searchParams
  expect(params.get('page')).toBe('1')
  expect(params.has('title')).toBe(false)
  expect(params.has('completed')).toBe(false)
})

test('preserves the create title and displays an accessible error when creation fails', async ({ page }) => {
  let createRequestCount = 0
  await page.route('http://localhost:3000/**', async (route) => {
    if (route.request().method() === 'GET') {
      await respondWithTasks(route, [])
      return
    }
    createRequestCount += 1
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Service unavailable' }),
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Create task' }).first().click()
  const titleInput = page.getByLabel('Task title')
  await titleInput.fill('   ')
  await page.getByRole('button', { name: 'Create task' }).last().click()
  await expect(titleInput).toHaveJSProperty('validity.valid', false)
  expect(createRequestCount).toBe(0)

  await titleInput.fill('Retry this task')
  await page.getByRole('button', { name: 'Create task' }).last().click()

  await expect(page.getByRole('alert')).toHaveText('Service unavailable')
  await expect(titleInput).toHaveValue('Retry this task')
  await expect(page.getByRole('button', { name: 'Create task' }).last()).toBeEnabled()
})

test('requires confirmation before deleting and refreshes the task list', async ({ page }) => {
  const tasks = makeTasks()
  const deleteRequests = []
  const listRequests = []
  let releaseDelete
  await page.route('http://localhost:3000/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (request.method() === 'GET' && url.pathname === '/tasks') {
      listRequests.push(url)
      await respondWithTasks(route, tasks)
      return
    }
    if (request.method() === 'DELETE') {
      deleteRequests.push(url.pathname)
      await new Promise((resolve) => {
        releaseDelete = resolve
      })
      const id = Number(url.pathname.split('/').at(-1))
      const index = tasks.findIndex((task) => task.id === id)
      if (index === -1) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Task not found' }),
        })
        return
      }
      tasks.splice(index, 1)
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Task deleted successfully' }),
      })
      return
    }
    await route.continue()
  })

  await page.goto('/')
  await page.getByRole('searchbox', { name: 'Title' }).fill('Task')
  await page.getByLabel('Completion').selectOption('false')
  await page.getByRole('button', { name: 'Apply' }).click()
  await page.getByRole('button', { name: 'Page 2' }).click()
  await page.getByRole('button', { name: 'Delete Task 12', exact: true }).click()
  await expect(page.getByRole('alertdialog')).toBeVisible()
  await expect(page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' })).toBeFocused()
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(page.getByRole('alertdialog').getByRole('button', { name: 'Cancel' })).toBeFocused()
  await page.getByRole('button', { name: 'Cancel' }).click()
  expect(deleteRequests).toHaveLength(0)
  await expect(page.getByRole('row').filter({ hasText: 'Task 12' })).toBeVisible()

  await page.getByRole('button', { name: 'Delete Task 12', exact: true }).click()
  const confirmButton = page.getByRole('alertdialog').getByRole('button', { name: 'Delete' })
  await confirmButton.click()
  await expect(page.getByRole('alertdialog').getByRole('button', { name: 'Deleting…' })).toBeDisabled()
  expect(deleteRequests).toHaveLength(1)
  releaseDelete()
  await expect(page.getByText('Page 1 of 1')).toBeVisible()
  await expect(page.getByRole('row').filter({ hasText: 'Task 12' })).toHaveCount(0)
  await expect(page.getByRole('row').filter({ hasText: 'Task 10' })).toBeVisible()
  const finalParams = listRequests.at(-1).searchParams
  expect(finalParams.get('page')).toBe('1')
  expect(finalParams.get('title')).toBe('Task')
  expect(finalParams.get('completed')).toBe('false')
  expect(deleteRequests).toEqual(['/deleteTask/12'])
})

test('keeps a task visible and announces a delete failure', async ({ page }) => {
  await page.route('http://localhost:3000/**', async (route) => {
    const request = route.request()
    if (request.method() === 'GET') {
      await respondWithTasks(route, makeTasks(1))
      return
    }
    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Task not found' }),
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Delete Task 1' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()

  await expect(page.getByRole('alert')).toHaveText('Task not found')
  await expect(page.getByRole('row').filter({ hasText: 'Task 1' })).toBeVisible()
})

test('saves title and completion updates through the API and refreshes the filtered list', async ({ page }) => {
  const tasks = makeTasks(3)
  const updateRequests = []
  const listRequests = []
  let releaseTitleUpdate
  await page.route('http://localhost:3000/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (request.method() === 'GET' && url.pathname === '/tasks') {
      listRequests.push(url)
      await respondWithTasks(route, tasks)
      return
    }
    if (request.method() === 'PUT' && url.pathname.startsWith('/updateTask/')) {
      const body = request.postDataJSON()
      updateRequests.push(body)
      if (updateRequests.length === 1) {
        await new Promise((resolve) => {
          releaseTitleUpdate = resolve
        })
      }
      const id = Number(url.pathname.split('/').at(-1))
      const task = tasks.find((item) => item.id === id)
      Object.assign(task, body)
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: task }),
      })
      return
    }
    await route.continue()
  })

  await page.goto('/')
  await page.getByLabel('Completion').selectOption('false')
  await page.getByRole('button', { name: 'Apply' }).click()
  await page.getByRole('button', { name: 'Edit Task 2', exact: true }).click()
  await page.getByLabel('Title for Task 2').fill('Discarded title')
  await page.getByRole('button', { name: 'Cancel' }).click()
  expect(updateRequests).toHaveLength(0)
  await expect(page.getByRole('row').filter({ hasText: 'Task 2' })).toBeVisible()

  await page.getByRole('button', { name: 'Edit Task 2', exact: true }).click()
  await page.getByLabel('Title for Task 2').fill('  Renamed Task 2  ')
  await page.getByRole('button', { name: 'Save' }).click()
  const savingButton = page.getByRole('button', { name: 'Saving…' })
  await expect(savingButton).toBeDisabled()
  expect(updateRequests).toEqual([{ title: 'Renamed Task 2' }])
  releaseTitleUpdate()
  await expect(page.getByRole('row').filter({ hasText: 'Renamed Task 2' })).toBeVisible()
  expect(listRequests.at(-1).searchParams.get('completed')).toBe('false')

  await page.getByRole('checkbox', { name: 'Mark Renamed Task 2 as completed' }).click()
  await expect(page.getByRole('heading', { name: 'No matching tasks' })).toBeVisible()
  expect(updateRequests).toEqual([
    { title: 'Renamed Task 2' },
    { completed: true },
  ])
  expect(listRequests.at(-1).searchParams.get('completed')).toBe('false')
})

test('preserves title edits and completion state when an update fails', async ({ page }) => {
  let updateRequestCount = 0
  await page.route('http://localhost:3000/**', async (route) => {
    const request = route.request()
    if (request.method() === 'GET') {
      await respondWithTasks(route, makeTasks(3))
      return
    }
    updateRequestCount += 1
    await route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Update rejected' }),
    })
  })

  await page.goto('/')
  await page.getByRole('button', { name: 'Edit Task 2', exact: true }).click()
  const titleInput = page.getByLabel('Title for Task 2')
  await titleInput.fill('Keep this edit')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('alert')).toHaveText('Update rejected')
  await expect(titleInput).toHaveValue('Keep this edit')
  await page.getByRole('button', { name: 'Cancel' }).click()

  const checkbox = page.getByRole('checkbox', { name: 'Mark Task 2 as completed' })
  await checkbox.click()
  await expect(page.getByRole('alert')).toHaveText('Update rejected')
  await expect(checkbox).not.toBeChecked()
  expect(updateRequestCount).toBe(2)
})
