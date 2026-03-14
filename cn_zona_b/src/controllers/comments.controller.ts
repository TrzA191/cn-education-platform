import { Request, Response } from 'express'
import { Comment, ContentRating } from '../models/CommentRating'

export const addComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const comment = await Comment.create({
      user_id: req.user!.userId,
      content_id: req.body.content_id,
      body: req.body.body,
    })
    res.status(201).json(comment)
  } catch (error) {
    console.error('[addComment]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const comments = await Comment.find({ content_id: req.params.contentId }).sort({ created_at: -1 })
    res.json(comments)
  } catch (error) {
    console.error('[getComments]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const addRating = async (req: Request, res: Response): Promise<void> => {
  try {
    const rating = await ContentRating.findOneAndUpdate(
      { user_id: req.user!.userId, content_id: req.body.content_id },
      { rating_stars: req.body.rating_stars },
      { upsert: true, new: true }
    )
    res.status(201).json(rating)
  } catch (error) {
    console.error('[addRating]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

export const getRatings = async (req: Request, res: Response): Promise<void> => {
  try {
    const ratings = await ContentRating.find({ content_id: req.params.contentId })
    const avg = ratings.length
      ? ratings.reduce((a, b) => a + b.rating_stars, 0) / ratings.length
      : 0
    res.json({ ratings, average: avg.toFixed(1), total: ratings.length })
  } catch (error) {
    console.error('[getRatings]', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}