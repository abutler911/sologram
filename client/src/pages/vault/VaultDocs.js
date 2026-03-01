// pages/vault/VaultDocs.js
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';
import axios from 'axios';
import {
  FaArrowLeft,
  FaPlus,
  FaTimes,
  FaEdit,
  FaTrash,
  FaSearch,
  FaChevronLeft,
} from 'react-icons/fa';

// ─── Constants ────────────────────────────────────────────────────────────────

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

// ─── API helpers ──────────────────────────────────────────────────────────────

const api = axios.create({ baseURL: '/api/vault/docs' });

// Attach token to every vault request
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// ─── Component ────────────────────────────────────────────────────────────────

const VaultDocs = () => {
  const navigate = useNavigate();

  // Views: 'list' | 'read' | 'edit'
  const [view, setView] = useState('list');
  const [docs, setDocs] = useState([]);
  const [activeDoc, setActiveDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Editor state
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'op-ed',
    tags: '',
    status: 'draft',
    excerpt: '',
  });

  const contentRef = useRef(null);

  // ── Fetch docs ──────────────────────────────────────────────────────────

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.q = searchQuery.trim();
      if (filterCategory) params.category = filterCategory;
      const { data } = await api.get('/', { params });
      setDocs(data.data || []);
    } catch (err) {
      console.error('Failed to fetch vault docs', err);
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
      const { data } = await api.get(`/${id}`);
      setActiveDoc(data.data);
      setView('read');
    } catch (err) {
      console.error('Failed to load doc', err);
    }
  };

  const startNew = () => {
    setActiveDoc(null);
    setForm({
      title: '',
      content: '',
      category: 'op-ed',
      tags: '',
      status: 'draft',
      excerpt: '',
    });
    setView('edit');
    // Focus content area after render
    setTimeout(() => contentRef.current?.focus(), 100);
  };

  const startEdit = () => {
    if (!activeDoc) return;
    setForm({
      title: activeDoc.title,
      content: activeDoc.content,
      category: activeDoc.category || 'op-ed',
      tags: (activeDoc.tags || []).join(', '),
      status: activeDoc.status || 'draft',
      excerpt: activeDoc.excerpt || '',
    });
    setView('edit');
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        category: form.category,
        tags: form.tags
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean),
        status: form.status,
        excerpt: form.excerpt.trim() || undefined,
      };

      if (activeDoc) {
        const { data } = await api.put(`/${activeDoc._id}`, payload);
        setActiveDoc(data.data);
      } else {
        const { data } = await api.post('/', payload);
        setActiveDoc(data.data);
      }
      setView('read');
      fetchDocs(); // refresh list in background
    } catch (err) {
      console.error('Failed to save doc', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/${id}`);
      setConfirmDelete(null);
      setActiveDoc(null);
      setView('list');
      fetchDocs();
    } catch (err) {
      console.error('Failed to delete doc', err);
    }
  };

  const goBack = () => {
    if (view === 'edit' && activeDoc) {
      setView('read');
    } else {
      setActiveDoc(null);
      setView('list');
    }
  };

  // ── Render helpers ──────────────────────────────────────────────────────

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const wordCount = (text) =>
    text
      .replace(/<[^>]*>/g, '')
      .split(/\s+/)
      .filter(Boolean).length;

  // ── LIST VIEW ───────────────────────────────────────────────────────────

  if (view === 'list') {
    return (
      <Shell>
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

          {/* Search + filter bar */}
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

          {/* New doc button */}
          <NewBtn onClick={startNew}>
            <FaPlus /> New Document
          </NewBtn>

          {/* Document list */}
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
                    <CategoryBadge $color={CATEGORY_COLORS[doc.category]}>
                      {doc.category}
                    </CategoryBadge>
                    <StatusDot $final={doc.status === 'final'} />
                  </DocCardTop>
                  <DocTitle>{doc.title}</DocTitle>
                  {doc.excerpt && <DocExcerpt>{doc.excerpt}</DocExcerpt>}
                  <DocMeta>
                    {formatDate(doc.createdAt)} · {doc.wordCount} words
                    {doc.tags?.length > 0 && (
                      <DocTags>
                        {doc.tags.slice(0, 3).map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </DocTags>
                    )}
                  </DocMeta>
                </DocCard>
              ))}
            </DocList>
          )}
        </Inner>
      </Shell>
    );
  }

  // ── READ VIEW ───────────────────────────────────────────────────────────

  if (view === 'read' && activeDoc) {
    return (
      <Shell>
        <Inner>
          <TopBar>
            <BackBtn onClick={goBack}>
              <FaChevronLeft /> Back
            </BackBtn>
            <ActionGroup>
              <IconBtn onClick={startEdit} title='Edit'>
                <FaEdit />
              </IconBtn>
              <IconBtn
                onClick={() => setConfirmDelete(activeDoc._id)}
                $danger
                title='Delete'
              >
                <FaTrash />
              </IconBtn>
            </ActionGroup>
          </TopBar>

          <ReadHeader>
            <CategoryBadge $color={CATEGORY_COLORS[activeDoc.category]}>
              {activeDoc.category}
            </CategoryBadge>
            <ReadTitle>{activeDoc.title}</ReadTitle>
            <ReadMeta>
              {formatDate(activeDoc.createdAt)}
              {activeDoc.updatedAt !== activeDoc.createdAt &&
                ` · updated ${formatDate(activeDoc.updatedAt)}`}
              {' · '}
              {activeDoc.wordCount} words
              {' · '}
              <StatusLabel $final={activeDoc.status === 'final'}>
                {activeDoc.status}
              </StatusLabel>
            </ReadMeta>
            {activeDoc.tags?.length > 0 && (
              <ReadTags>
                {activeDoc.tags.map((t) => (
                  <Tag key={t}>{t}</Tag>
                ))}
              </ReadTags>
            )}
          </ReadHeader>

          <ReadBody>{activeDoc.content}</ReadBody>

          {/* Delete confirmation */}
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
        </Inner>
      </Shell>
    );
  }

  // ── EDIT VIEW ───────────────────────────────────────────────────────────

  return (
    <Shell>
      <Inner>
        <TopBar>
          <BackBtn onClick={goBack}>
            <FaChevronLeft /> Cancel
          </BackBtn>
          <SaveBtn onClick={handleSave} disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : activeDoc ? 'Update' : 'Create'}
          </SaveBtn>
        </TopBar>

        <EditorSection>
          <EditorLabel>Title</EditorLabel>
          <TitleInput
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder='Document title…'
            maxLength={200}
          />

          <EditorRow>
            <EditorCol>
              <EditorLabel>Category</EditorLabel>
              <Select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </EditorCol>
            <EditorCol>
              <EditorLabel>Status</EditorLabel>
              <Select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value }))
                }
              >
                <option value='draft'>Draft</option>
                <option value='final'>Final</option>
              </Select>
            </EditorCol>
          </EditorRow>

          <EditorLabel>Tags (comma-separated)</EditorLabel>
          <TagInput
            value={form.tags}
            onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
            placeholder='politics, aviation, culture…'
          />

          <EditorLabel>
            Content{' '}
            <WordCounter>{wordCount(form.content)} words</WordCounter>
          </EditorLabel>
          <ContentArea
            ref={contentRef}
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            placeholder='Start writing…'
          />
        </EditorSection>
      </Inner>
    </Shell>
  );
};

export default VaultDocs;

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
`;

// ─── Shell / Layout ───────────────────────────────────────────────────────────

const Shell = styled.div`
  min-height: 100vh;
  background: ${NOIR.ink};
  color: ${NOIR.warmWhite};
  overflow-x: hidden;

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

// ─── Top bar ──────────────────────────────────────────────────────────────────

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0 0;
`;

const baseBtn = css`
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
  ${baseBtn}
  color: ${NOIR.ash};
  &:hover {
    color: ${NOIR.warmWhite};
  }
`;

const BackBtn = styled.button`
  ${baseBtn}
  color: ${NOIR.ash};
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

// ─── Header ───────────────────────────────────────────────────────────────────

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
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  letter-spacing: 0.1em;
  color: ${NOIR.ash};
`;

// ─── Toolbar ──────────────────────────────────────────────────────────────────

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
  font-family: 'DM Mono', 'Courier New', monospace;
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
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.55rem;
  letter-spacing: 0.05em;
  text-transform: capitalize;
  padding: 4px 10px;
  border: 1px solid
    ${(p) =>
      p.$active ? p.$color || NOIR.warmWhite : 'rgba(255,255,255,0.1)'};
  background: ${(p) =>
    p.$active ? 'rgba(255,255,255,0.06)' : 'transparent'};
  color: ${(p) => (p.$active ? p.$color || NOIR.warmWhite : NOIR.ash)};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: ${(p) => p.$color || 'rgba(255,255,255,0.3)'};
    color: ${(p) => p.$color || NOIR.warmWhite};
  }
`;

// ─── New button ───────────────────────────────────────────────────────────────

const NewBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  justify-content: center;
  padding: 12px;
  margin-bottom: 24px;
  border: 1px dashed rgba(0, 255, 65, 0.3);
  background: rgba(0, 255, 65, 0.03);
  color: ${NOIR.green};
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: rgba(0, 255, 65, 0.06);
    border-color: rgba(0, 255, 65, 0.5);
  }
`;

// ─── Doc list ─────────────────────────────────────────────────────────────────

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

const CategoryBadge = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.5rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${(p) => p.$color || NOIR.ash};
  border: 1px solid ${(p) => (p.$color ? `${p.$color}44` : 'rgba(255,255,255,0.1)')};
  padding: 2px 8px;
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
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.55rem;
  color: ${NOIR.charcoal};
`;

const DocTags = styled.span`
  display: inline-flex;
  gap: 4px;
  margin-left: 4px;
`;

const Tag = styled.span`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.5rem;
  color: ${NOIR.ash};
  background: rgba(255, 255, 255, 0.04);
  padding: 1px 6px;
`;

// ─── Empty / Loading ──────────────────────────────────────────────────────────

const LoadingMsg = styled.div`
  text-align: center;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.7rem;
  color: ${NOIR.ash};
  padding: 60px 0;
`;

const Blink = styled.span`
  animation: ${blink} 1s step-end infinite;
`;

const EmptyState = styled.div`
  text-align: center;
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.65rem;
  color: ${NOIR.charcoal};
  padding: 60px 0;
`;

// ─── Read view ────────────────────────────────────────────────────────────────

const ActionGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const IconBtn = styled.button`
  ${baseBtn}
  color: ${(p) => (p.$danger ? '#ff4444' : NOIR.ash)};
  padding: 6px;
  font-size: 0.8rem;

  &:hover {
    color: ${(p) => (p.$danger ? '#ff6666' : NOIR.warmWhite)};
  }
`;

const ReadHeader = styled.div`
  margin: 24px 0 32px;
  animation: ${fadeUp} 0.3s ease;
`;

const ReadTitle = styled.h1`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-weight: 400;
  font-style: italic;
  font-size: 2rem;
  color: ${NOIR.warmWhite};
  margin: 12px 0 8px;
  line-height: 1.2;
`;

const ReadMeta = styled.div`
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.6rem;
  color: ${NOIR.ash};
`;

const StatusLabel = styled.span`
  color: ${(p) => (p.$final ? NOIR.sage : NOIR.gold)};
  text-transform: uppercase;
  letter-spacing: 0.1em;
`;

const ReadTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
`;

const ReadBody = styled.div`
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 1.1rem;
  line-height: 1.8;
  color: ${NOIR.dust};
  white-space: pre-wrap;
  word-break: break-word;
  animation: ${fadeIn} 0.4s ease;
`;

// ─── Delete confirmation ──────────────────────────────────────────────────────

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
  font-family: 'DM Mono', 'Courier New', monospace;
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
  ${baseBtn}
  color: ${NOIR.ash};
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 8px 20px;

  &:hover {
    color: ${NOIR.warmWhite};
  }
`;

const ConfirmDeleteBtn = styled.button`
  ${baseBtn}
  color: ${NOIR.ink};
  background: #ff4444;
  border: none;
  padding: 8px 20px;

  &:hover {
    background: #ff6666;
  }
`;

// ─── Edit view ────────────────────────────────────────────────────────────────

const SaveBtn = styled.button`
  ${baseBtn}
  color: ${NOIR.ink};
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
  font-family: 'DM Mono', 'Courier New', monospace;
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

const inputBase = css`
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: ${NOIR.warmWhite};
  font-family: 'Cormorant Garamond', Georgia, serif;
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
  ${inputBase}
  font-size: 1.3rem;
  font-style: italic;
`;

const TagInput = styled.input`
  ${inputBase}
  font-family: 'DM Mono', 'Courier New', monospace;
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
  ${inputBase}
  font-family: 'DM Mono', 'Courier New', monospace;
  font-size: 0.7rem;
  text-transform: capitalize;
  cursor: pointer;
`;

const ContentArea = styled.textarea`
  ${inputBase}
  font-size: 1.05rem;
  line-height: 1.8;
  min-height: 400px;
  resize: vertical;
`;