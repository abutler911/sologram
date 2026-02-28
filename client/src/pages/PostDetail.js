import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
} from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  FaHeart,
  FaRegHeart,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaShare,
  FaTimes,
  FaExpandAlt,
  FaMapMarkerAlt,
  FaEllipsisV,
} from 'react-icons/fa';
import { useSwipeable } from 'react-swipeable';
import { AuthContext } from '../context/AuthContext';
import { useDeleteModal } from '../context/DeleteModalContext';
import { api } from '../services/api';
import { getTransformedImageUrl } from '../utils/cloudinary';
import { COLORS } from '../theme';
import ReactGA from 'react-ga4';

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

const heartPop = keyframes`
  0%   { transform: scale(1);   }
  30%  { transform: scale(1.5); }
  60%  { transform: scale(0.9); }
  100% { transform: scale(1);   }
`;

const dropIn = keyframes`
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0)    scale(1);    }
`;

const shimmer = keyframes`
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
`;

// ─── Component ────────────────────────────────────────────────────────────────

const PostDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showFsControls, setShowFsControls] = useState(true);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [readingTime, setReadingTime] = useState('< 1 min');

  const fsTimeoutRef = useRef(null);
  const adminMenuRef = useRef(null);

  const { isAuthenticated } = useContext(AuthContext);
  const { showDeleteModal } = useDeleteModal();

  // ── Scroll progress ──────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const progress = total > 0 ? (window.scrollY / total) * 100 : 0;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Click-away admin menu ────────────────────────────────────────────────
  useEffect(() => {
    if (!showAdminMenu) return;
    const h = (e) => {
      if (adminMenuRef.current && !adminMenuRef.current.contains(e.target))
        setShowAdminMenu(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [showAdminMenu]);

  // ── Fetch post ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        const raw = await api.getPost(id);

        // api.getPost returns { success: true, data: { _id, title, media, ... } }
        // Unwrap .data so the component always works with the plain post object.
        // The fallback (raw itself) keeps things working if the service layer
        // ever returns the post directly.
        const data = raw?.data ?? raw;

        setPost(data);

        if (data.content) {
          const words = data.content.trim().split(/\s+/).length;
          const mins = Math.ceil(words / 200);
          setReadingTime(`${mins} min read`);
        }

        ReactGA.event('view_post', {
          post_id: data._id,
          post_title: data.title,
        });
      } catch (err) {
        console.error('[PostDetail] fetch error:', err);
        setError(
          'Failed to load post. It may have been deleted or does not exist.'
        );
        toast.error('Failed to load post');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id]);

  // ── Keyboard nav ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!post?.media?.length) return;
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') setActiveMediaIndex((p) => Math.max(p - 1, 0));
      if (e.key === 'ArrowRight')
        setActiveMediaIndex((p) => Math.min(p + 1, post.media.length - 1));
      if (e.key === 'Escape' && showFullscreen) setShowFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [post, showFullscreen]);

  // ── Fullscreen auto-hide controls ────────────────────────────────────────
  const resetFsTimeout = useCallback(() => {
    clearTimeout(fsTimeoutRef.current);
    setShowFsControls(true);
    fsTimeoutRef.current = setTimeout(() => setShowFsControls(false), 3000);
  }, []);

  useEffect(() => {
    if (!showFullscreen) return;
    resetFsTimeout();
    document.addEventListener('mousemove', resetFsTimeout);
    document.addEventListener('touchstart', resetFsTimeout);
    return () => {
      clearTimeout(fsTimeoutRef.current);
      document.removeEventListener('mousemove', resetFsTimeout);
      document.removeEventListener('touchstart', resetFsTimeout);
    };
  }, [showFullscreen, resetFsTimeout]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleLike = async () => {
    if (!isAuthenticated || !post || isLiked) {
      if (!isAuthenticated) toast.error('Log in to like posts');
      return;
    }
    try {
      await api.likePost(id);
      setIsLiked(true);
      setPost((p) => ({ ...p, likes: (p.likes || 0) + 1 }));
      setIsLikeAnimating(true);
      setTimeout(() => setIsLikeAnimating(false), 500);
    } catch {
      toast.error('Failed to like post');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({ title: post?.title, url: window.location.href })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleDeletePost = () => {
    if (!post) return;
    showDeleteModal({
      title: 'Delete Post?',
      message:
        'This will permanently remove this post and all its interactions.',
      confirmText: 'Delete Post',
      onConfirm: async () => {
        try {
          await api.deletePost(id);
          toast.success('Post deleted');
          navigate('/');
        } catch {
          toast.error('Failed to delete post');
        }
      },
    });
    setShowAdminMenu(false);
  };

  const handleLocationClick = (location) => {
    const enc = encodeURIComponent(location);
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    window.open(
      isIOS
        ? `https://maps.apple.com/?q=${enc}`
        : `https://www.google.com/maps/search/?api=1&query=${enc}`,
      '_blank'
    );
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () =>
      post?.media &&
      setActiveMediaIndex((p) => Math.min(p + 1, post.media.length - 1)),
    onSwipedRight: () => setActiveMediaIndex((p) => Math.max(p - 1, 0)),
    trackMouse: true,
  });

  const mediaCount = post?.media?.length || 0;

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageWrapper>
        <ProgressBarContainer>
          <ProgressBar $width='0%' />
        </ProgressBarContainer>
        <SkeletonHero />
        <SkeletonContent>
          <SkeletonLine $w='60%' $h='2rem' />
          <SkeletonLine $w='90%' $h='1rem' />
          <SkeletonLine $w='80%' $h='1rem' />
          <SkeletonLine $w='40%' $h='1rem' />
        </SkeletonContent>
      </PageWrapper>
    );
  }

  if (error || !post) {
    return (
      <PageWrapper>
        <ErrorWrap>
          <ErrorMsg>{error || 'Post not found'}</ErrorMsg>
          <BackBtn to='/'>
            <FaArrowLeft /> Back to Home
          </BackBtn>
        </ErrorWrap>
      </PageWrapper>
    );
  }

  const formattedDate = format(
    new Date(post.eventDate || post.createdAt),
    'MMMM d, yyyy'
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PageWrapper>
      {/* Reading progress */}
      <ProgressBarContainer>
        <ProgressBar $width={`${scrollProgress}%`} />
      </ProgressBarContainer>

      {/* Back nav */}
      <TopNav>
        <BackBtn to='/'>
          <FaArrowLeft /> Feed
        </BackBtn>
      </TopNav>

      <ArticleWrap>
        {/* ── HERO MEDIA ──────────────────────────────────────────────────── */}
        {mediaCount > 0 && (
          <HeroFrame {...swipeHandlers}>
            <MediaTrack
              style={{ transform: `translateX(-${activeMediaIndex * 100}%)` }}
            >
              {post.media.map((m, i) => (
                <MediaSlide key={m._id || i}>
                  {m.mediaType === 'video' ? (
                    <HeroVid src={m.mediaUrl} controls preload='metadata' />
                  ) : (
                    <HeroImg
                      src={getTransformedImageUrl(m.mediaUrl, {
                        width: 1200,
                        height: 1500,
                        crop: 'fill',
                        quality: 'auto',
                        format: 'auto',
                      })}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      alt={post.title || 'Sologram'}
                    />
                  )}
                </MediaSlide>
              ))}
            </MediaTrack>

            <ExpandBtn
              onClick={() => setShowFullscreen(true)}
              aria-label='Fullscreen'
            >
              <FaExpandAlt />
            </ExpandBtn>

            {mediaCount > 1 && (
              <>
                {activeMediaIndex > 0 && (
                  <NavBtn
                    $side='left'
                    onClick={() => setActiveMediaIndex((p) => p - 1)}
                  >
                    <FaChevronLeft />
                  </NavBtn>
                )}
                {activeMediaIndex < mediaCount - 1 && (
                  <NavBtn
                    $side='right'
                    onClick={() => setActiveMediaIndex((p) => p + 1)}
                  >
                    <FaChevronRight />
                  </NavBtn>
                )}
                <Dots>
                  {post.media.map((_, i) => (
                    <Dot
                      key={i}
                      $active={i === activeMediaIndex}
                      onClick={() => setActiveMediaIndex(i)}
                    />
                  ))}
                </Dots>
              </>
            )}
          </HeroFrame>
        )}

        {/* ── CONTENT ─────────────────────────────────────────────────────── */}
        <ContentBody>
          <ContentInner>
            <PostMeta>
              <ReadingTime>{readingTime}</ReadingTime>
              {post.location && (
                <MetaLocation
                  onClick={() => handleLocationClick(post.location)}
                >
                  <FaMapMarkerAlt size={10} /> {post.location}
                </MetaLocation>
              )}
            </PostMeta>

            <PostTitle>{post.title}</PostTitle>

            {post.caption && <PostCaption>{post.caption}</PostCaption>}

            {post.content && <PostContent>{post.content}</PostContent>}

            {post.tags?.length > 0 && (
              <TagRow>
                {post.tags.map((t, i) => (
                  <Tag key={i}>#{t}</Tag>
                ))}
              </TagRow>
            )}

            <EngagementStrip>
              <EngageBtn onClick={handleLike} $active={isLiked}>
                <EngageIcon $active={isLiked} $animating={isLikeAnimating}>
                  {isLiked ? <FaHeart /> : <FaRegHeart />}
                </EngageIcon>
                <span>{post.likes || 0} likes</span>
              </EngageBtn>

              <EngageBtn onClick={handleShare}>
                <FaShare />
                <span>Share</span>
              </EngageBtn>

              {isAuthenticated && (
                <AdminWrapper ref={adminMenuRef} style={{ marginLeft: 'auto' }}>
                  <EngageBtn onClick={() => setShowAdminMenu((v) => !v)}>
                    <FaEllipsisV />
                  </EngageBtn>
                  {showAdminMenu && (
                    <AdminDropdown>
                      <Link
                        to={`/edit/${post._id}`}
                        onClick={() => setShowAdminMenu(false)}
                      >
                        <FaEdit /> Edit Post
                      </Link>
                      <button onClick={handleDeletePost} className='danger'>
                        <FaTrash /> Delete
                      </button>
                    </AdminDropdown>
                  )}
                </AdminWrapper>
              )}
            </EngagementStrip>
          </ContentInner>
        </ContentBody>
      </ArticleWrap>

      {/* ── FULLSCREEN MODAL ────────────────────────────────────────────────── */}
      {showFullscreen && (
        <FullscreenOverlay onClick={() => setShowFullscreen(false)}>
          <FullscreenInner onClick={(e) => e.stopPropagation()}>
            {post.media[activeMediaIndex].mediaType === 'video' ? (
              <FullscreenVid
                src={post.media[activeMediaIndex].mediaUrl}
                controls
                autoPlay
              />
            ) : (
              <FullscreenImg
                src={post.media[activeMediaIndex].mediaUrl}
                alt={post.title}
              />
            )}

            <FsClose
              onClick={() => setShowFullscreen(false)}
              $visible={showFsControls}
            >
              <FaTimes />
            </FsClose>

            {mediaCount > 1 && (
              <>
                {activeMediaIndex > 0 && (
                  <FsNav
                    $side='left'
                    $visible={showFsControls}
                    onClick={() => setActiveMediaIndex((p) => p - 1)}
                  >
                    <FaChevronLeft />
                  </FsNav>
                )}
                {activeMediaIndex < mediaCount - 1 && (
                  <FsNav
                    $side='right'
                    $visible={showFsControls}
                    onClick={() => setActiveMediaIndex((p) => p + 1)}
                  >
                    <FaChevronRight />
                  </FsNav>
                )}
              </>
            )}
          </FullscreenInner>
        </FullscreenOverlay>
      )}
    </PageWrapper>
  );
};

export default PostDetail;

// ─── Styled Components ────────────────────────────────────────────────────────

const PageWrapper = styled.div`
  background: ${COLORS.background};
  min-height: 100vh;
`;

// ── Progress bar ──────────────────────────────────────────────────────────────

const ProgressBarContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: rgba(255, 255, 255, 0.06);
  z-index: 200;
`;

const ProgressBar = styled.div`
  height: 100%;
  width: ${(p) => p.$width || '0%'};
  background: linear-gradient(
    90deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryMint}
  );
  transition: width 0.1s linear;
`;

// ── Top nav ───────────────────────────────────────────────────────────────────

const TopNav = styled.div`
  padding: 16px 20px 0;
  max-width: 680px;
  margin: 0 auto;
`;

const BackBtn = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${COLORS.textTertiary};
  text-decoration: none;
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  transition: color 0.2s;
  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

// ── Article wrapper ───────────────────────────────────────────────────────────

const ArticleWrap = styled.article`
  max-width: 680px;
  margin: 16px auto 80px;
  animation: ${fadeUp} 0.45s ease both;
`;

// ── Hero media ────────────────────────────────────────────────────────────────

const HeroFrame = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  background: #000;
  overflow: hidden;
  border-radius: 0;
  -webkit-tap-highlight-color: transparent;

  @media (min-width: 480px) {
    border-radius: 8px;
  }
`;

const MediaTrack = styled.div`
  display: flex;
  height: 100%;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: transform;
`;

const MediaSlide = styled.div`
  flex: 0 0 100%;
  height: 100%;
`;

const HeroImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const HeroVid = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const ExpandBtn = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: none;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 3;
  transition: background 0.15s, transform 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.72);
    transform: scale(1.1);
    color: #fff;
  }
`;

// ── Admin dropdown ────────────────────────────────────────────────────────────

const AdminWrapper = styled.div`
  position: relative;
`;

const AdminDropdown = styled.div`
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 12px;
  min-width: 150px;
  overflow: hidden;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.65);
  animation: ${dropIn} 0.18s ease;
  z-index: 10;

  a,
  button {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 12px 16px;
    border: none;
    background: none;
    color: ${COLORS.textPrimary};
    font-size: 0.875rem;
    text-decoration: none;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s;
    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }
  }
  .danger {
    color: ${COLORS.error};
  }
`;

// ── Carousel nav ──────────────────────────────────────────────────────────────

const NavBtn = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${(p) => p.$side}: 12px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.48);
  backdrop-filter: blur(4px);
  border: none;
  color: #fff;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
  transition: background 0.15s, transform 0.15s;
  &:hover {
    background: rgba(0, 0, 0, 0.72);
    transform: translateY(-50%) scale(1.08);
  }
`;

const Dots = styled.div`
  position: absolute;
  top: 14px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  z-index: 2;
`;

const Dot = styled.div`
  height: 4px;
  width: ${(p) => (p.$active ? '20px' : '4px')};
  border-radius: 2px;
  background: ${(p) => (p.$active ? '#fff' : 'rgba(255,255,255,0.38)')};
  cursor: pointer;
  transition: width 0.28s cubic-bezier(0.22, 1, 0.36, 1), background 0.2s;
`;

// ── Content section ───────────────────────────────────────────────────────────

const ContentBody = styled.div`
  background: ${COLORS.cardBackground};
  border-top: 1px solid rgba(255, 255, 255, 0.04);

  @media (min-width: 480px) {
    border-radius: 0 0 8px 8px;
  }
`;

const ContentInner = styled.div`
  padding: 22px 20px 28px;
`;

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
`;

const ReadingTime = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${COLORS.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.8px;
`;

const MetaLocation = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 0;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${COLORS.primarySalmon};
  text-transform: uppercase;
  letter-spacing: 0.8px;
  cursor: pointer;
  transition: color 0.2s;
  &:hover {
    color: ${COLORS.accentSalmon};
  }
`;

const PostTitle = styled.h1`
  font-size: clamp(1.5rem, 4vw, 2rem);
  font-weight: 900;
  color: ${COLORS.textPrimary};
  letter-spacing: -0.04em;
  line-height: 1.1;
  margin-bottom: 12px;
`;

const PostCaption = styled.p`
  font-size: 1rem;
  font-weight: 500;
  line-height: 1.6;
  color: ${COLORS.textPrimary};
  margin-bottom: 16px;
`;

const PostContent = styled.div`
  font-size: 0.95rem;
  line-height: 1.75;
  color: ${COLORS.textSecondary};
  white-space: pre-line;
  margin-bottom: 20px;
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 24px;
`;

const Tag = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: ${COLORS.textTertiary};
  transition: color 0.2s, border-color 0.2s;
  &:hover {
    color: ${COLORS.accentMint};
    border-color: ${COLORS.primaryMint}55;
  }
`;

// ── Engagement strip ──────────────────────────────────────────────────────────

const EngagementStrip = styled.div`
  display: flex;
  gap: 12px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const EngageBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  border: 1px solid
    ${(p) =>
      p.$active ? COLORS.primarySalmon + '55' : 'rgba(255,255,255,0.08)'};
  border-radius: 24px;
  padding: 8px 16px;
  color: ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.textTertiary)};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: ${COLORS.primarySalmon}55;
    color: ${COLORS.primarySalmon};
    background: ${COLORS.primarySalmon}0a;
  }
`;

const EngageIcon = styled.span`
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  color: ${(p) => (p.$active ? COLORS.primarySalmon : 'inherit')};

  ${(p) =>
    p.$animating &&
    css`
      animation: ${heartPop} 0.4s ease;
    `}
`;

// ── Fullscreen modal ──────────────────────────────────────────────────────────

const FullscreenOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.96);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${fadeUp} 0.2s ease;
`;

const FullscreenInner = styled.div`
  position: relative;
  width: 96vw;
  height: 96vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FullscreenImg = styled.img`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
`;

const FullscreenVid = styled.video`
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
`;

const FsClose = styled.button`
  position: absolute;
  top: 0;
  right: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.3s, background 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const FsNav = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  ${(p) => p.$side}: 0;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: ${(p) => (p.$visible ? 1 : 0)};
  transition: opacity 0.3s, background 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

// ── Skeleton loading ──────────────────────────────────────────────────────────

const skeletonShimmer = css`
  background: linear-gradient(
    90deg,
    ${COLORS.cardBackground} 25%,
    ${COLORS.elevatedBackground} 50%,
    ${COLORS.cardBackground} 75%
  );
  background-size: 600px 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
`;

const SkeletonHero = styled.div`
  max-width: 680px;
  margin: 16px auto 0;
  aspect-ratio: 4 / 5;
  ${skeletonShimmer}
  @media (min-width: 480px) {
    border-radius: 8px;
  }
`;

const SkeletonContent = styled.div`
  max-width: 680px;
  margin: 0 auto;
  background: ${COLORS.cardBackground};
  padding: 22px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const SkeletonLine = styled.div`
  height: ${(p) => p.$h || '1rem'};
  width: ${(p) => p.$w || '100%'};
  border-radius: 4px;
  ${skeletonShimmer}
`;

// ── Error ─────────────────────────────────────────────────────────────────────

const ErrorWrap = styled.div`
  max-width: 480px;
  margin: 80px auto;
  text-align: center;
  padding: 0 20px;
`;

const ErrorMsg = styled.div`
  background: rgba(255, 107, 107, 0.1);
  color: ${COLORS.error};
  padding: 20px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 107, 107, 0.25);
  font-size: 0.95rem;
`;
