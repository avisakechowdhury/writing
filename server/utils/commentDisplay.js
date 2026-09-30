export const getPostAuthorId = (post) => {
  if (!post) return '';
  const id = post.authorId?._id ?? post.authorId;
  return id?.toString?.() ?? (id ? String(id) : '');
};

export const resolveCommentAuthorName = (post, comment) => {
  if (!comment) return 'Anonymous';
  const commentAuthorId = comment.authorId?._id?.toString?.() ?? comment.authorId?.toString?.() ?? (comment.authorId ? String(comment.authorId) : '');
  if (post?.isAnonymous && commentAuthorId && commentAuthorId === getPostAuthorId(post)) {
    return 'Author';
  }
  return comment.authorName || 'Anonymous';
};

export const commentAuthorNameForUser = (post, userId, displayName) => {
  const authorId = getPostAuthorId(post);
  if (post?.isAnonymous && userId && userId.toString() === authorId) {
    return 'Author';
  }
  return displayName;
};

export const transformComment = (post, comment) => {
  if (!comment) return null;
  return {
    id: comment.id || comment._id?.toString?.() || '',
    postId: post?._id,
    authorId: comment.authorId,
    authorName: resolveCommentAuthorName(post, comment),
    content: comment.content || '',
    parentId: comment.parentId || null,
    createdAt: comment.createdAt,
    likes: comment.likes || 0,
    likedBy: (comment.likedBy || []).map((id) => id.toString()),
    reactions: comment.reactions || []
  };
};

