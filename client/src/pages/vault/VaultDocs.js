// pages/vault/VaultDocs.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FaArrowLeft,
  FaPlus,
  FaTimes,
  FaEdit,
  FaTrash,
  FaSearch,
  FaChevronLeft,
} from 'react-icons/fa';

// ─── Palette ──────────────────────────────────────────────────────────────────

const NOIR = {
  ink: '#0a0a0b',
  warmWhite: '#faf9f7',
  dust: '#e8e4dd',
  ash: '#a09a91',
  charcoal: '#3a3632',
  salmon: '#e87c5a',
  sage: '#7aab8c',
  gold: '#c9a84c',
  green: '#00ff41',
};

const EDITORIAL = {
  paper: '#fdfcf9',
  text: '#1a1a1a',
  subtle: '#6b6b6b',
  rule: '#d4cfc6',
  accent: '#c9a84c',
  quoteBar: '#c9a84c',
  noteBg: '#f5f3ee',
};

const CATEGORIES = [
  'op-ed',
  'essay',
  'letter',
  'manifesto',
  'reflection',
  'draft',
  'uncategorized',
];

const CATEGORY_COLORS = {
  'op-ed': NOIR.salmon,
  essay: NOIR.sage,
  letter: NOIR.gold,
  manifesto: '#ff4444',
  reflection: '#8b7ec8',
  draft: NOIR.ash,
  uncategorized: NOIR.charcoal,
};

// ─── Content renderer ─────────────────────────────────────────────────────────
// Parses plain text into structured blocks for editorial display.
//   \n\n    → paragraph break
//   > text  → pull quote
//   ---     → horizontal rule
//   First paragraph gets a drop cap.

const parseContent = (raw) => {
  if (!raw) return [];
  const blocks = [];
  const chunks = raw.split(/\n{2,}/);

  chunks.forEach((chunk) => {
    const trimmed = chunk.trim();
    if (!trimmed) return;
    if (trimmed === '---' || trimmed === '***') {
      blocks.push({ type: 'rule' });
    } else if (trimmed.startsWith('> ')) {
      blocks.push({
        type: 'quote',
        text: trimmed.replace(/^>\s?/gm, '').trim(),
      });
    } else {
      blocks.push({ type: 'paragraph', text: trimmed });
    }
  });

  return blocks;
};

const ContentRenderer = ({ content }) => {
  const blocks = parseContent(content);
  let isFirstParagraph = true;

  return blocks.map((block, i) => {
    if (block.type === 'rule') return <EditorialRule key={i} />;
    if (block.type === 'quote')
      return <PullQuote key={i}>{block.text}</PullQuote>;

    // First paragraph gets a drop cap
    if (isFirstParagraph) {
      isFirstParagraph = false;
      const firstChar = block.text.charAt(0);
      const rest = block.text.slice(1);
      return (
        <Paragraph key={i}>
          <DropCap>{firstChar}</DropCap>
          {rest}
        </Paragraph>
      );
    }
    return <Paragraph key={i}>{block.text}</Paragraph>;
  });
};

// ─── Component ────────────────────────────────────────────────────────────────

const VaultDocs = () => {
  const navigate = useNavigate();

  const [view, setView] = useState('list'); // 'list' | 'read' | 'edit'
  const [docs, setDocs] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    content: '',
    category: 'op-ed',
    tags: '',
    status: 'draft',
    authorNote: '',
  });

  const contentRef = useRef(null);

  // ── API (uses global axios which already has the auth header) ───────────

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (filterCategory) params.category = filterCategory;
      const { data } = await axios.get('/api/vault/docs', { params });
      setDocs(data.data || []);
    } catch (err) {
      console.error('[VaultDocs] fetch failed', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error('Session expired — log in again');
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, filterCategory]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  // ── Handlers ────────────────────────────────────────────────────────────

  const openDoc = async (id) => {
    try {
      const { data } = await axios.get(`/api/vault/docs/${id}`);
      setActiveDoc(data.data);
      setView('read');
      window.scrollTo(0, 0);
    } catch (err) {
      toast.error('Failed to load document');
    }
  };

  const startNew = () => {
    setActiveDoc(null);
    setForm({
      title: '',
      subtitle: '',
      content: '',
      category: 'op-ed',
      tags: '',
      status: 'draft',
      authorNote: '',
    });
    setView('edit');
    setTimeout(() => contentRef.current?.focus(), 100);
  };

  const startEdit = () => {
    if (!activeDoc) return;
    setForm({
      title: activeDoc.title || '',
      subtitle: activeDoc.subtitle || '',
      content: activeDoc.content || '',
      category: activeDoc.category || 'op-ed',
      tags: (activeDoc.tags || []).join(', '),
      status: activeDoc.status || 'draft',
      authorNote: activeDoc.authorNote || '',
    });
    setView('edit');
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim() || undefined,
        content: form.content.trim(),
        category: form.category,
        tags: form.tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        status: form.status,
        authorName: 'Arthur Penhaligon',
        authorNote: form.authorNote.trim() || undefined,
      };

      let result;
      if (activeDoc) {
        result = await axios.put(`/api/vault/docs/${activeDoc._id}`, payload);
        toast.success('Document updated');
      } else {
        result = await axios.post('/api/vault/docs', payload);
        toast.success('Document created');
      }
      setActiveDoc(result.data.data);
      setView('read');
      window.scrollTo(0, 0);
      fetchDocs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save';
      toast.error(msg);
      console.error('[VaultDocs] save failed', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/vault/docs/${id}`);
      toast.success('Document deleted');
      setConfirmDelete(null);
      setActiveDoc(null);
      setView('list');
      fetchDocs();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const goBack = () => {
    if (view === 'edit' && activeDoc) {
      setView('read');
    } else {
      setActiveDoc(null);
      setView('list');
    }
    window.scrollTo(0, 0);
  };

  // ── Helpers ─────────────────────────────────────────────────────────────

  const fmtDate = (d) =>
    new Date(d)
      .toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
      .toUpperCase();

  const fmtDateShort = (d) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const countWords = (text) =>
    text
      .replace(/<[^>]*>/g, '')
      .split(/\s+/)
      .filter(Boolean).length;

  const setField = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // ══════════════════════════════════════════════════════════════════════════
  //  LIST VIEW
  // ══════════════════════════════════════════════════════════════════════════

  if (view === 'list') {
    return (
      <DarkShell>
        <Inner>
          <TopBar>
            <ExitBtn onClick={() => navigate('/')}>
              <FaArrowLeft /> Exit vault
            </ExitBtn>
            <VaultBadge>⬡ DEAD DROP</VaultBadge>
          </TopBar>

          <Header>
            <HeaderTitle>Document Repository</HeaderTitle>
            <HeaderSub>
              {docs.length} document{docs.length !== 1 ? 's' : ''} archived
            </HeaderSub>
          </Header>

          <ToolBar>
            <SearchWrap>
              <FaSearch />
              <SearchInput
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder='Search documents…'
              />
              {searchQuery && (
                <ClearBtn onClick={() => setSearchQuery('')}>
                  <FaTimes />
                </ClearBtn>
              )}
            </SearchWrap>
            <FilterRow>
              <FilterChip
                $active={!filterCategory}
                onClick={() => setFilterCategory('')}
              >
                All
              </FilterChip>
              {CATEGORIES.map((cat) => (
                <FilterChip
                  key={cat}
                  $active={filterCategory === cat}
                  $color={CATEGORY_COLORS[cat]}
                  onClick={() =>
                    setFilterCategory(filterCategory === cat ? '' : cat)
                  }
                >
                  {cat}
                </FilterChip>
              ))}
            </FilterRow>
          </ToolBar>

          <NewBtn onClick={startNew}>
            <FaPlus /> New Document
          </NewBtn>

          {loading ? (
            <LoadingMsg>
              Decrypting archive<Blink>_</Blink>
            </LoadingMsg>
          ) : docs.length === 0 ? (
            <EmptyState>
              {searchQuery || filterCategory
                ? 'No documents match your search.'
                : 'The vault is empty. Start writing.'}
            </EmptyState>
          ) : (
            <DocList>
              {docs.map((doc, i) => (
                <DocCard
                  key={doc._id}
                  onClick={() => openDoc(doc._id)}
                  $delay={i * 40}
                >
                  <DocCardTop>
                    <CatBadge $color={CATEGORY_COLORS[doc.category]}>
                      {doc.category}
                    </CatBadge>
                    <StatusDot $final={doc.status === 'final'} />
                  </DocCardTop>
                  <DocTitle>{doc.title}</DocTitle>
                  {doc.subtitle && <DocSubtitle>{doc.subtitle}</DocSubtitle>}
                  {doc.excerpt && <DocExcerpt>{doc.excerpt}</DocExcerpt>}
                  <DocMeta>
                    {fmtDateShort(doc.createdAt)} · {doc.wordCount} words
                  </DocMeta>
                  {doc.tags?.length > 0 && (
                    <DocTags>
                      {doc.tags.slice(0, 4).map((t) => (
                        <Tag key={t}>{t}</Tag>
                      ))}
                    </DocTags>
                  )}
                </DocCard>
              ))}
            </DocList>
          )}
        </Inner>
      </DarkShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  READ VIEW — editorial newspaper layout
  // ══════════════════════════════════════════════════════════════════════════

  if (view === 'read' && activeDoc) {
    return (
      <ReadShell>
        {/* Floating dark toolbar */}
        <ReadToolbar>
          <BackBtnDark onClick={goBack}>
            <FaChevronLeft /> Back
          </BackBtnDark>
          <ReadActions>
            <ToolbarBtn onClick={startEdit} title='Edit'>
              <FaEdit />
            </ToolbarBtn>
            <ToolbarBtn
              onClick={() => setConfirmDelete(activeDoc._id)}
              $danger
              title='Delete'
            >
              <FaTrash />
            </ToolbarBtn>
          </ReadActions>
        </ReadToolbar>

        <ReadInner>
          {/* Category badge */}
          <ReadCategory $color={CATEGORY_COLORS[activeDoc.category]}>
            {activeDoc.category}
          </ReadCategory>

          {/* Title */}
          <ReadTitle>{activeDoc.title}</ReadTitle>

          {/* Subtitle / deck */}
          {activeDoc.subtitle && (
            <ReadSubtitle>{activeDoc.subtitle}</ReadSubtitle>
          )}

          {/* Byline */}
          <Byline>
            <BylineRule />
            <BylineText>
              BY ARTHUR PENHALIGON
              <BylineSep>|</BylineSep>
              {fmtDate(activeDoc.createdAt)}
            </BylineText>
            <BylineRule />
          </Byline>

          {/* Body */}
          <ReadBody>
            <ContentRenderer content={activeDoc.content} />
          </ReadBody>

          {/* Author note */}
          {activeDoc.authorNote && (
            <AuthorNoteBox>
              <AuthorNoteLabel>Author's Note:</AuthorNoteLabel>{' '}
              {activeDoc.authorNote}
            </AuthorNoteBox>
          )}

          {/* Tags footer */}
          {activeDoc.tags?.length > 0 && (
            <ReadFooterTags>
              {activeDoc.tags.map((t) => (
                <ReadTag key={t}>{t}</ReadTag>
              ))}
            </ReadFooterTags>
          )}

          <ReadMeta>
            {activeDoc.wordCount} words · {activeDoc.status}
            {activeDoc.updatedAt !== activeDoc.createdAt &&
              ` · updated ${fmtDateShort(activeDoc.updatedAt)}`}
          </ReadMeta>
        </ReadInner>

        {/* Delete confirm */}
        {confirmDelete && (
          <ConfirmOverlay onClick={() => setConfirmDelete(null)}>
            <ConfirmBox onClick={(e) => e.stopPropagation()}>
              <ConfirmTitle>Delete this document?</ConfirmTitle>
              <ConfirmSub>This action cannot be undone.</ConfirmSub>
              <ConfirmActions>
                <ConfirmCancelBtn onClick={() => setConfirmDelete(null)}>
                  Cancel
                </ConfirmCancelBtn>
                <ConfirmDeleteBtn onClick={() => handleDelete(confirmDelete)}>
                  Delete
                </ConfirmDeleteBtn>
              </ConfirmActions>
            </ConfirmBox>
          </ConfirmOverlay>
        )}
      </ReadShell>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  EDIT VIEW
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <DarkShell>
      <Inner>
        <TopBar>
          <ExitBtn onClick={goBack}>
            <FaChevronLeft /> Cancel
          </ExitBtn>
          <SaveBtn onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : activeDoc ? 'Update' : 'Create'}
          </SaveBtn>
        </TopBar>

        <EditorSection>
          <EditorLabel>Title *</EditorLabel>
          <TitleInput
            value={form.title}
            onChange={setField('title')}
            placeholder='Document title…'
            maxLength={200}
          />

          <EditorLabel>Subtitle / Deck</EditorLabel>
          <SubtitleInput
            value={form.subtitle}
            onChange={setField('subtitle')}
            placeholder='A strategic analysis of…'
            maxLength={300}
          />

          <EditorRow>
            <EditorCol>
              <EditorLabel>Category</EditorLabel>
              <Select value={form.category} onChange={setField('category')}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </EditorCol>
            <EditorCol>
              <EditorLabel>Status</EditorLabel>
              <Select value={form.status} onChange={setField('status')}>
                <option value='draft'>Draft</option>
                <option value='final'>Final</option>
              </Select>
            </EditorCol>
          </EditorRow>

          <EditorLabel>Tags (comma-separated)</EditorLabel>
          <TagInput
            value={form.tags}
            onChange={setField('tags')}
            placeholder='politics, aviation, culture…'
          />

          <EditorLabel>
            Content *{' '}
            <WordCounter>{countWords(form.content)} words</WordCounter>
          </EditorLabel>
          <HintText>
            Tip: Use {'>'} at the start of a paragraph for pull quotes. Use ---
            for horizontal rules.
          </HintText>
          <ContentArea
            ref={contentRef}
            value={form.content}
            onChange={setField('content')}
            placeholder='Start writing…'
          />

          <EditorLabel>Author's Note (optional)</EditorLabel>
          <NoteArea
            value={form.authorNote}
            onChange={setField('authorNote')}
            placeholder='Closing note, disclaimer, context…'
          />
        </EditorSection>
      </Inner>
    </DarkShell>
  );
};

export default VaultDocs;

// ═══════════════════════════════════════════════════════════════════════════════
// ANIMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

const fadeUp = keyframes`from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}`;
const fadeIn = keyframes`from{opacity:0}to{opacity:1}`;
const blink = keyframes`0%,100%{opacity:1}50%{opacity:0}`;

// ═══════════════════════════════════════════════════════════════════════════════
// DARK SHELL (list + edit)
// ═══════════════════════════════════════════════════════════════════════════════

const DarkShell = styled.div`
  min-height: 100vh;
  background: ${NOIR.ink};
  color: ${NOIR.warmWhite};
  @media (min-width: 960px) {
    margin-left: 72px;
    width: calc(100% - 72px);
  }
  @media (min-width: 1200px) {
    margin-left: 240px;
    width: calc(100% - 240px);
  }
`;

const Inner = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 0 20px 80px;
`;

// ═══════════════════════════════════════════════════════════════════════════════
// TOP BAR (shared)
// ═══════════════════════════════════════════════════════════════════════════════

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0 0;
`;

const monoBtn = css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.7rem;
  letter-spacing: 0.06em;
  transition: color 0.15s;
`;

const ExitBtn = styled.button`
  ${monoBtn} color: ${NOIR.ash};
  &:hover {
    color: ${NOIR.warmWhite};
  }
`;

const VaultBadge = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.2em;
  color: ${NOIR.green};
`;

// ═══════════════════════════════════════════════════════════════════════════════
// LIST VIEW
// ═══════════════════════════════════════════════════════════════════════════════

const Header = styled.div`
  margin: 32px 0 24px;
  animation: ${fadeUp} 0.35s ease;
`;
const HeaderTitle = styled.h1`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 400;
  font-style: italic;
  font-size: 2rem;
  color: ${NOIR.warmWhite};
  margin: 0 0 6px;
`;
const HeaderSub = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  color: ${NOIR.ash};
`;

const ToolBar = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SearchWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 8px 12px;
  color: ${NOIR.ash};
  font-size: 0.75rem;
`;
const SearchInput = styled.input`
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: ${NOIR.warmWhite};
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  &::placeholder {
    color: ${NOIR.charcoal};
  }
`;
const ClearBtn = styled.button`
  background: none;
  border: none;
  color: ${NOIR.ash};
  cursor: pointer;
  padding: 2px;
  font-size: 0.65rem;
  &:hover {
    color: ${NOIR.warmWhite};
  }
`;

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;
const FilterChip = styled.button`
  font-family: 'DM Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.05em;
  text-transform: capitalize;
  padding: 4px 10px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px solid
    ${(p) => (p.$active ? p.$color || NOIR.warmWhite : 'rgba(255,255,255,0.1)')};
  background: ${(p) => (p.$active ? 'rgba(255,255,255,0.06)' : 'transparent')};
  color: ${(p) => (p.$active ? p.$color || NOIR.warmWhite : NOIR.ash)};
  &:hover {
    border-color: ${(p) => p.$color || 'rgba(255,255,255,0.3)'};
    color: ${(p) => p.$color || NOIR.warmWhite};
  }
`;

const NewBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  justify-content: center;
  padding: 12px;
  margin-bottom: 24px;
  cursor: pointer;
  transition: all 0.15s;
  border: 1px dashed rgba(0, 255, 65, 0.3);
  background: rgba(0, 255, 65, 0.03);
  color: ${NOIR.green};
  font-family: 'DM Mono', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  &:hover {
    background: rgba(0, 255, 65, 0.06);
    border-color: rgba(0, 255, 65, 0.5);
  }
`;

const DocList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
`;

const DocCard = styled.button`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  text-align: left;
  transition: background 0.15s, border-color 0.15s;
  animation: ${fadeUp} 0.3s ease both;
  animation-delay: ${(p) => p.$delay}ms;
  &:hover {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.12);
  }
`;
const DocCardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const CatBadge = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 0.5rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 2px 8px;
  color: ${(p) => p.$color || NOIR.ash};
  border: 1px solid
    ${(p) => (p.$color ? `${p.$color}44` : 'rgba(255,255,255,0.1)')};
`;
const StatusDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${(p) => (p.$final ? NOIR.sage : NOIR.gold)};
`;
const DocTitle = styled.div`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.15rem;
  font-weight: 500;
  color: ${NOIR.warmWhite};
  line-height: 1.3;
`;
const DocSubtitle = styled.div`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-size: 0.85rem;
  color: ${NOIR.ash};
  line-height: 1.4;
`;
const DocExcerpt = styled.div`
  font-size: 0.75rem;
  color: ${NOIR.ash};
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
const DocMeta = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 0.55rem;
  color: ${NOIR.charcoal};
`;
const DocTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
`;
const Tag = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 0.5rem;
  color: ${NOIR.ash};
  background: rgba(255, 255, 255, 0.04);
  padding: 1px 6px;
`;

const LoadingMsg = styled.div`
  text-align: center;
  font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  color: ${NOIR.ash};
  padding: 60px 0;
`;
const Blink = styled.span`
  animation: ${blink} 1s step-end infinite;
`;
const EmptyState = styled.div`
  text-align: center;
  font-family: 'DM Mono', monospace;
  font-size: 0.65rem;
  color: ${NOIR.charcoal};
  padding: 60px 0;
`;

// ═══════════════════════════════════════════════════════════════════════════════
// READ VIEW — EDITORIAL / NEWSPAPER LAYOUT
// ═══════════════════════════════════════════════════════════════════════════════

const ReadShell = styled.div`
  min-height: 100vh;
  background: ${EDITORIAL.paper};
  @media (min-width: 960px) {
    margin-left: 72px;
    width: calc(100% - 72px);
  }
  @media (min-width: 1200px) {
    margin-left: 240px;
    width: calc(100% - 240px);
  }
`;

const ReadToolbar = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: rgba(10, 10, 11, 0.92);
  backdrop-filter: blur(12px);
`;

const BackBtnDark = styled.button`
  ${monoBtn} color: rgba(255,255,255,0.5);
  &:hover {
    color: #fff;
  }
`;
const ReadActions = styled.div`
  display: flex;
  gap: 8px;
`;
const ToolbarBtn = styled.button`
  ${monoBtn} font-size: 0.8rem;
  padding: 6px;
  color: ${(p) => (p.$danger ? '#ff4444' : 'rgba(255,255,255,0.4)')};
  &:hover {
    color: ${(p) => (p.$danger ? '#ff6666' : '#fff')};
  }
`;

const ReadInner = styled.div`
  max-width: 640px;
  margin: 0 auto;
  padding: 48px 24px 80px;
  animation: ${fadeIn} 0.4s ease;
`;

const ReadCategory = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${(p) => p.$color || EDITORIAL.subtle};
  margin-bottom: 16px;
`;

const ReadTitle = styled.h1`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 700;
  font-size: 2.4rem;
  line-height: 1.15;
  color: ${EDITORIAL.text};
  margin: 0 0 12px;
  letter-spacing: -0.01em;

  @media (min-width: 600px) {
    font-size: 2.8rem;
  }
`;

const ReadSubtitle = styled.div`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-weight: 400;
  font-size: 1.15rem;
  line-height: 1.5;
  color: ${EDITORIAL.subtle};
  margin-bottom: 24px;
`;

// ── Byline ────────────────────────────────────────────────────────────────────

const Byline = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 36px;
`;
const BylineRule = styled.div`
  flex: 1;
  height: 1px;
  background: ${EDITORIAL.rule};
`;
const BylineText = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  color: ${EDITORIAL.subtle};
  white-space: nowrap;
`;
const BylineSep = styled.span`
  margin: 0 10px;
  color: ${EDITORIAL.rule};
`;

// ── Body typography ───────────────────────────────────────────────────────────

const ReadBody = styled.div`
  margin-bottom: 40px;
`;

const Paragraph = styled.p`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.15rem;
  line-height: 1.85;
  color: ${EDITORIAL.text};
  margin: 0 0 24px;
  text-align: justify;
  hyphens: auto;
`;

const DropCap = styled.span`
  float: left;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 700;
  font-size: 4.2rem;
  line-height: 0.78;
  padding: 6px 8px 0 0;
  color: ${EDITORIAL.text};
`;

const PullQuote = styled.blockquote`
  margin: 36px 0 36px 0;
  padding: 16px 0 16px 24px;
  border-left: 3px solid ${EDITORIAL.quoteBar};
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-style: italic;
  font-weight: 400;
  font-size: 1.2rem;
  line-height: 1.7;
  color: ${EDITORIAL.text};
`;

const EditorialRule = styled.hr`
  border: none;
  height: 1px;
  background: ${EDITORIAL.rule};
  margin: 36px auto;
  width: 80px;
`;

// ── Author note ───────────────────────────────────────────────────────────────

const AuthorNoteBox = styled.div`
  margin: 40px 0 32px;
  padding: 20px 24px;
  background: ${EDITORIAL.noteBg};
  border: 1px solid ${EDITORIAL.rule};
  border-left: 3px solid ${EDITORIAL.accent};
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 0.85rem;
  line-height: 1.7;
  color: ${EDITORIAL.subtle};
  font-style: italic;
`;
const AuthorNoteLabel = styled.span`
  font-style: normal;
  font-weight: 700;
  font-size: 0.7rem;
  font-family: 'DM Mono', monospace;
  letter-spacing: 0.08em;
  color: ${EDITORIAL.text};
  text-transform: uppercase;
`;

// ── Footer meta ───────────────────────────────────────────────────────────────

const ReadFooterTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
`;
const ReadTag = styled.span`
  font-family: 'DM Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.06em;
  padding: 3px 10px;
  color: ${EDITORIAL.subtle};
  border: 1px solid ${EDITORIAL.rule};
`;

const ReadMeta = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 0.5rem;
  letter-spacing: 0.06em;
  color: ${EDITORIAL.rule};
  text-transform: uppercase;
  padding-top: 16px;
  margin-top: 8px;
  border-top: 1px solid ${EDITORIAL.rule};
  opacity: 0.6;
`;

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE CONFIRM
// ═══════════════════════════════════════════════════════════════════════════════

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadeIn} 0.15s ease;
`;
const ConfirmBox = styled.div`
  background: ${NOIR.ink};
  border: 1px solid rgba(255, 68, 68, 0.3);
  padding: 28px;
  max-width: 340px;
  text-align: center;
`;
const ConfirmTitle = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 0.75rem;
  color: ${NOIR.warmWhite};
  margin-bottom: 8px;
`;
const ConfirmSub = styled.div`
  font-size: 0.65rem;
  color: ${NOIR.ash};
  margin-bottom: 20px;
`;
const ConfirmActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: center;
`;
const ConfirmCancelBtn = styled.button`
  ${monoBtn} color: ${NOIR.ash};
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 20px;
  &:hover {
    color: ${NOIR.warmWhite};
  }
`;
const ConfirmDeleteBtn = styled.button`
  ${monoBtn} color: ${NOIR.ink};
  background: #ff4444;
  border: none;
  padding: 8px 20px;
  &:hover {
    background: #ff6666;
  }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT VIEW
// ═══════════════════════════════════════════════════════════════════════════════

const SaveBtn = styled.button`
  ${monoBtn} color: ${NOIR.ink};
  background: ${NOIR.green};
  padding: 8px 20px;
  letter-spacing: 0.1em;
  &:hover:not(:disabled) {
    opacity: 0.85;
  }
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const EditorSection = styled.div`
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: ${fadeUp} 0.3s ease;
`;
const EditorLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'DM Mono', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.1em;
  color: ${NOIR.ash};
  text-transform: uppercase;
`;
const WordCounter = styled.span`
  color: ${NOIR.charcoal};
  text-transform: none;
  letter-spacing: 0;
`;

const HintText = styled.div`
  font-family: 'DM Mono', monospace;
  font-size: 0.55rem;
  color: ${NOIR.charcoal};
  margin-top: -6px;
`;

const inputBase = css`
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: ${NOIR.warmWhite};
  padding: 10px 14px;
  outline: none;
  transition: border-color 0.15s;
  box-sizing: border-box;
  &:focus {
    border-color: rgba(0, 255, 65, 0.3);
  }
  &::placeholder {
    color: ${NOIR.charcoal};
  }
`;

const TitleInput = styled.input`
  ${inputBase} font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.3rem;
  font-style: italic;
`;
const SubtitleInput = styled.input`
  ${inputBase} font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 0.95rem;
  font-style: italic;
`;
const TagInput = styled.input`
  ${inputBase} font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
`;

const EditorRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;
const EditorCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Select = styled.select`
  ${inputBase} font-family: 'DM Mono', monospace;
  font-size: 0.7rem;
  text-transform: capitalize;
  cursor: pointer;
`;

const ContentArea = styled.textarea`
  ${inputBase} font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.05rem;
  line-height: 1.8;
  min-height: 400px;
  resize: vertical;
`;

const NoteArea = styled.textarea`
  ${inputBase} font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 0.9rem;
  line-height: 1.6;
  min-height: 100px;
  resize: vertical;
`;
