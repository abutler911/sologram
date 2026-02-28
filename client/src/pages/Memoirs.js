// pages/Memoirs.js
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import styled, { keyframes } from 'styled-components';
import { FaArrowLeft, FaBook, FaChevronRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { COLORS } from '../theme';
import LoadingSpinner from '../components/common/LoadingSpinner';

const MONTH_NAMES = [
  '',
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const Memoirs = () => {
  const [selectedId, setSelectedId] = useState(null);

  const {
    data: memoirList,
    isLoading: listLoading,
    error: listError,
  } = useQuery({
    queryKey: ['memoirs'],
    queryFn: api.getMemoirs,
    staleTime: 5 * 60 * 1000,
  });

  const { data: memoirDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['memoir', selectedId],
    queryFn: () => api.getMemoir(selectedId),
    enabled: !!selectedId,
    staleTime: 10 * 60 * 1000,
  });

  const memoirs = memoirList?.data || [];
  const detail = memoirDetail?.data || null;

  if (listLoading) {
    return <LoadingSpinner text='Loading' size='52px' height='50vh' />;
  }

  if (listError) {
    return (
      <ErrorState>
        <ErrorText>Failed to load memoirs. Please try again.</ErrorText>
      </ErrorState>
    );
  }

  // ── Detail view ───────────────────────────────────────────────────────────
  if (selectedId && detail) {
    return (
      <Container>
        <BackButton onClick={() => setSelectedId(null)}>
          <FaArrowLeft />
          <span>All Memoirs</span>
        </BackButton>

        <DetailCard>
          <DetailDate>
            {MONTH_NAMES[detail.month]} {detail.year}
          </DetailDate>
          <DetailTitle>{detail.title}</DetailTitle>

          {detail.themes?.length > 0 && (
            <ThemesRow>
              {detail.themes.map((theme, i) => (
                <ThemeTag key={i}>{theme}</ThemeTag>
              ))}
            </ThemesRow>
          )}

          <DetailContent>
            {detail.content.split('\n').map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </DetailContent>

          <DetailFooter>
            <Stat>{detail.stats?.postCount || 0} posts</Stat>
            <StatDot />
            <Stat>{detail.stats?.thoughtCount || 0} thoughts</Stat>
          </DetailFooter>
        </DetailCard>
      </Container>
    );
  }

  if (detailLoading && selectedId) {
    return <LoadingSpinner text='Loading' size='52px' height='50vh' />;
  }

  // ── List view ─────────────────────────────────────────────────────────────
  return (
    <Container>
      <BackLink to='/'>
        <FaArrowLeft />
        <span>Back to Home</span>
      </BackLink>

      <PageHeader>
        <HeaderIcon>
          <FaBook />
        </HeaderIcon>
        <div>
          <PageTitle>Memoirs</PageTitle>
          <PageSubtitle>
            Monthly snapshots, written by AI from Andrew's real posts and
            thoughts.
          </PageSubtitle>
        </div>
      </PageHeader>

      {memoirs.length === 0 ? (
        <EmptyState>No memoirs yet. Check back next month.</EmptyState>
      ) : (
        <MemoirGrid>
          {memoirs.map((m) => (
            <MemoirCard key={m._id} onClick={() => setSelectedId(m._id)}>
              <CardDate>
                {MONTH_NAMES[m.month]} {m.year}
              </CardDate>
              <CardTitle>{m.title}</CardTitle>
              {m.themes?.length > 0 && (
                <CardThemes>
                  {m.themes.slice(0, 3).map((t, i) => (
                    <ThemeTag key={i}>{t}</ThemeTag>
                  ))}
                </CardThemes>
              )}
              <CardFooter>
                <CardStats>
                  {m.stats?.postCount || 0} posts &middot;{' '}
                  {m.stats?.thoughtCount || 0} thoughts
                </CardStats>
                <FaChevronRight size={12} color={COLORS.textTertiary} />
              </CardFooter>
            </MemoirCard>
          ))}
        </MemoirGrid>
      )}
    </Container>
  );
};

export default Memoirs;

// ── Animations ──────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// ── Layout ──────────────────────────────────────────────────────────────────

const Container = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 24px 16px 60px;
  animation: ${fadeUp} 0.4s ease-out;
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${COLORS.textTertiary};
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 500;
  margin-bottom: 24px;
  transition: color 0.15s;

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: ${COLORS.textTertiary};
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  padding: 0;
  margin-bottom: 24px;
  transition: color 0.15s;

  &:hover {
    color: ${COLORS.primarySalmon};
  }
`;

// ── Page Header ─────────────────────────────────────────────────────────────

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 32px;
`;

const HeaderIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: rgba(233, 137, 115, 0.1);
  border: 1px solid rgba(233, 137, 115, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${COLORS.primarySalmon};
  font-size: 1.2rem;
  flex-shrink: 0;
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  margin: 0;
`;

const PageSubtitle = styled.p`
  font-size: 0.82rem;
  color: ${COLORS.textTertiary};
  margin: 4px 0 0;
  line-height: 1.4;
`;

// ── Memoir Cards ────────────────────────────────────────────────────────────

const MemoirGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MemoirCard = styled.div`
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 14px;
  padding: 20px;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s, box-shadow 0.15s;

  &:hover {
    border-color: ${COLORS.primarySalmon}66;
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
`;

const CardDate = styled.div`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${COLORS.primarySalmon};
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
`;

const CardTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  margin: 0 0 10px;
  line-height: 1.35;
`;

const CardThemes = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
`;

const ThemeTag = styled.span`
  font-size: 0.7rem;
  padding: 3px 10px;
  border-radius: 20px;
  background: rgba(101, 142, 169, 0.12);
  color: ${COLORS.primaryMint};
  font-weight: 500;
  letter-spacing: 0.3px;
`;

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CardStats = styled.span`
  font-size: 0.75rem;
  color: ${COLORS.textTertiary};
`;

// ── Detail View ─────────────────────────────────────────────────────────────

const DetailCard = styled.div`
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  padding: 32px 28px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);

  @media (max-width: 480px) {
    padding: 24px 18px;
  }
`;

const DetailDate = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${COLORS.primarySalmon};
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 8px;
`;

const DetailTitle = styled.h1`
  font-size: 1.6rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  margin: 0 0 16px;
  line-height: 1.3;

  @media (max-width: 480px) {
    font-size: 1.3rem;
  }
`;

const ThemesRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 24px;
`;

const DetailContent = styled.div`
  color: ${COLORS.textSecondary};
  font-size: 0.95rem;
  line-height: 1.75;

  p {
    margin: 0 0 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const DetailFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 28px;
  padding-top: 16px;
  border-top: 1px solid ${COLORS.border};
`;

const Stat = styled.span`
  font-size: 0.78rem;
  color: ${COLORS.textTertiary};
  font-weight: 500;
`;

const StatDot = styled.div`
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: ${COLORS.textTertiary};
`;

// ── States ──────────────────────────────────────────────────────────────────

const ErrorState = styled.div`
  display: flex;
  justify-content: center;
  padding: 80px 20px;
`;

const ErrorText = styled.p`
  color: ${COLORS.error};
  font-size: 0.9rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: ${COLORS.textTertiary};
  font-size: 0.9rem;
`;
