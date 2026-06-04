export const getPostAuthorId = (post) => {
  const id = post.authorId?._id ?? post.authorId;
  return id?.toString?.() ?? String(id);
};

export const resolveCommentAuthorName = (post, comment) => {
  const commentAuthorId = comment.authorId?.toString?.() ?? String(comment.authorId);
  if (post.isAnonymous && commentAuthorId === getPostAuthorId(post)) {
    return 'Author';
  }
  return comment.authorName;
};

export const commentAuthorNameForUser = (post, userId, displayName) => {
  const authorId = getPostAuthorId(post);
  if (post.isAnonymous && userId.toString() === authorId) {
    return 'Author';
  }
  return displayName;
};

export const transformComment = (post, comment) => ({
  id: comment.id,
  postId: post._id,
  authorId: comment.authorId,
  authorName: resolveCommentAuthorName(post, comment),
  content: comment.content,
  parentId: comment.parentId || null,
  createdAt: comment.createdAt,
  likes: comment.likes,
  likedBy: (comment.likedBy || []).map((id) => id.toString()),
  reactions: comment.reactions || []
});
