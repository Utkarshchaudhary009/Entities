#!/usr/bin/env bun
import { writeFileSync } from 'fs'
import { $ } from 'bun'

interface PRInfo {
  number: number
  title: string
  url: string
  author: { login: string }
  state: string
}

interface Review {
  id: string,
  author: {
    login: string
  },
  authorAssociation: string,
  body: string,
  submittedAt: string,
  includesCreatedEdit: boolean,
  reactionGroups: [],
  state: string,
  commit: {
    oid: string
  }
}

async function getLatestPR(): Promise<PRInfo> {
  const prs =
    await $`gh pr list --limit 1 --json number,title,url,author,state`.json()
  return prs[0]
}

async function getPRReviews(prNumber: number): Promise<Review[]> {
  const result = await $`gh pr view ${prNumber} --json reviews`.json()
  return result.reviews || []
}

function generateReviewMD(pr: PRInfo, reviews: Review[]): string {
  const timestamp = new Date().toISOString()
  const lines: string[] = []

  lines.push(`# Code Review: PR #${pr.number}`)
  lines.push('')
  lines.push(`**Title:** ${pr.title}`)
  lines.push(`**Author:** ${pr.author.login}`)
  lines.push(`**State:** ${pr.state}`)
  lines.push(`**URL:** ${pr.url}`)
  lines.push(`**Generated:** ${timestamp}`)
  lines.push('')
  lines.push('---')
  lines.push('')

  const detailedReviews = reviews.filter(
    (r) => r.body && r.body.trim().length > 0
  )

  if (detailedReviews.length > 0) {
    lines.push('## Reviews')
    lines.push('')

    for (const review of detailedReviews) {
      const reviewer = review.author?.login || 'Bot'
      lines.push(`### Review by ${reviewer}`)
      lines.push('')

      const body = review.body

      lines.push(body.trim())
      lines.push('')
      lines.push('---')
      lines.push('')
    }
  }

  if (detailedReviews.length === 0) {
    lines.push('## No Reviews Found')
    lines.push('')
    lines.push('No review feedback found on this PR.')
    lines.push('')
  }

  return lines.join('\n')
}

async function main() {
  console.log('Fetching latest PR...')

  const pr = await getLatestPR()

  if (!pr) {
    console.error('No open PRs found')
    process.exit(1)
  }

  console.log(`Found PR #${pr.number}: ${pr.title}`)
  console.log('Fetching reviews...')

  const reviews = await getPRReviews(pr.number)
  console.log(`Found ${reviews.length} reviews`)

  const reviewContent = generateReviewMD(pr, reviews)

  writeFileSync('review.md', reviewContent)
  console.log('Review the issues above and implement fixes as needed. Created review.md')
}

main().catch(console.error)
