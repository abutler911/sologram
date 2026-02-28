import React, {
  useState,
  useEffect,
  useCallback,
  useContext,
  useRef,
} from 'react';
import styled, { keyframes, css } from 'styled-components';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import {
  FaDownload,
  FaTrash,
  FaFilter,
  FaCopy,
  FaTimes,
  FaImage,
  FaVideo,
  FaCalendarAlt,
  FaCheckSquare,
  FaSquare,
  FaLayerGroup,
} from 'react-icons/fa';
import { getTransformedImageUrl } from '../utils/cloudinary';
import { COLORS } from '../theme';
import { AuthContext } from '../context/AuthContext';
import { useDeleteModal } from '../context/DeleteModalContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDate = (date) => format(new Date(date), 'MMM d, yyyy');

const toUTCISOFromLocal = (yyyyMmDd, endOfDay = false) => {
  if (!yyyyMmDd) return null;
  const t = endOfDay ? 'T23:59:59.999' : 'T00:00:00.000';
  return new Date(`${yyyyMmDd}${t}`).toISOString();
};

const groupAssetsByDate = (assets) => {
  const grouped = {};
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  assets.forEach((asset) => {
    const date = new Date(asset.created_at);
    let dateKey, dateLabel;

    if (date.toDateString() === today.toDateString()) {
      dateKey = 'today';
      dateLabel = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = 'yesterday';
      dateLabel = 'Yesterday';
    } else if (today - date < 7 * 86_400_000) {
      dateKey = 'thisWeek';
      dateLabel = 'This Week';
    } else if (
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      dateKey = 'thisMonth';
      dateLabel = 'This Month';
    } else {
      dateKey = `${date.getFullYear()}-${date.getMonth()}`;
      dateLabel = format(date, 'MMMM yyyy');
    }

    if (!grouped[dateKey]) grouped[dateKey] = { label: dateLabel, assets: [] };
    grouped[dateKey].assets.push(asset);
  });

  const order = ['today', 'yesterday', 'thisWeek', 'thisMonth'];
  const ordered = {};
  order.forEach((k) => {
    if (grouped[k]) {
      ordered[k] = grouped[k];
      delete grouped[k];
    }
  });
  Object.keys(grouped)
    .sort((a, b) => b.localeCompare(a))
    .forEach((k) => {
      ordered[k] = grouped[k];
    });
  return ordered;
};

// ─── Component ────────────────────────────────────────────────────────────────

const CloudinaryGallery = () => {
  const { user } = useContext(AuthContext);
  const { showDeleteModal } = useDeleteModal();
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    dateRange: 'all',
    startDate: null,
    endDate: null,
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    images: 0,
    videos: 0,
    storage: 0,
  });
  const [selectedAssets, setSelectedAssets] = useState([]);
  const [selectMode, setSelectMode] = useState(false);

  const observerRef = useRef();

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Admin access required');
      navigate('/');
    }
  }, [user, navigate]);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchAssets = useCallback(async (currentPage, currentFilters) => {
    if (currentPage === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const apiFilters = { ...currentFilters };
      if (apiFilters.startDate)
        apiFilters.startDate = toUTCISOFromLocal(apiFilters.startDate, false);
      if (apiFilters.endDate)
        apiFilters.endDate = toUTCISOFromLocal(apiFilters.endDate, true);

      const data = await api.getCloudinaryAssets({
        page: currentPage,
        limit: 30,
        ...apiFilters,
      });

      if (!data?.results) throw new Error('Invalid response format');

      const { results, totalCount, hasMore: more, statistics } = data;

      setAssets((prev) =>
        currentPage === 1 ? results : [...prev, ...results]
      );
      setHasMore(!!more);
      setStats({
        total: totalCount || 0,
        images: statistics?.imageCount || 0,
        videos: statistics?.videoCount || 0,
        storage: statistics?.totalStorage || 0,
      });
      setError(null);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to load media assets';
      setError(msg);
      if (currentPage === 1) setAssets([]);
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchAssets(page, filters);
  }, [page, filters, fetchAssets]);

  // ── Infinite scroll ────────────────────────────────────────────────────────
  const lastItemRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting && hasMore) setPage((p) => p + 1);
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, loadingMore, hasMore]
  );

  // ── Selection ──────────────────────────────────────────────────────────────
  const toggleSelectMode = () => {
    setSelectMode((v) => !v);
    setSelectedAssets([]);
  };

  const toggleAssetSelection = (e, id) => {
    e.stopPropagation();
    setSelectedAssets((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ── Delete single ──────────────────────────────────────────────────────────
  const handleDeleteAsset = (publicId) => {
    const asset = assets.find((a) => a.public_id === publicId);
    const assetName = asset?.public_id.split('/').pop() || 'this asset';
    const type = asset?.resource_type === 'video' ? 'video' : 'image';

    showDeleteModal({
      title: `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      message: `This will permanently remove the file from Cloudinary.`,
      confirmText: `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      cancelText: 'Keep Asset',
      itemName: assetName,
      onConfirm: async () => {
        try {
          await api.deleteCloudinaryAsset(publicId);
          toast.success('Asset deleted');
          setAssets((prev) => prev.filter((a) => a.public_id !== publicId));
          if (selectedAsset?.public_id === publicId) setSelectedAsset(null);
          setStats((prev) => ({
            ...prev,
            total: prev.total - 1,
            images:
              asset?.resource_type === 'image' ? prev.images - 1 : prev.images,
            videos:
              asset?.resource_type === 'video' ? prev.videos - 1 : prev.videos,
          }));
        } catch (err) {
          const status = err.response?.status;
          if (status === 404) toast.error('API endpoint not found');
          else if (status === 403)
            toast.error('Cannot delete assets outside the SoloGram folder');
          else
            toast.error(
              err.response?.data?.message || 'Failed to delete asset'
            );
        }
      },
      destructive: true,
    });
  };

  // ── Bulk delete ────────────────────────────────────────────────────────────
  const bulkDeleteAssets = () => {
    if (!selectedAssets.length) return;
    const preview =
      selectedAssets
        .slice(0, 3)
        .map(
          (id) =>
            assets
              .find((a) => a.public_id === id)
              ?.public_id.split('/')
              .pop() || id
        )
        .join(', ') +
      (selectedAssets.length > 3
        ? ` and ${selectedAssets.length - 3} more`
        : '');

    showDeleteModal({
      title: `Delete ${selectedAssets.length} Assets`,
      message: `This will permanently remove ${selectedAssets.length} files from Cloudinary.`,
      confirmText: `Delete ${selectedAssets.length} Assets`,
      cancelText: 'Cancel',
      itemName: preview,
      onConfirm: async () => {
        const toastId = toast.loading(
          `Deleting ${selectedAssets.length} assets…`
        );
        let ok = 0,
          fail = 0;
        for (const id of selectedAssets) {
          try {
            await api.deleteCloudinaryAsset(id);
            ok++;
          } catch {
            fail++;
          }
        }
        toast.dismiss(toastId);
        if (fail === 0) toast.success(`Deleted ${ok} assets`);
        else toast.error(`Deleted ${ok}, failed ${fail}`);
        fetchAssets(1, filters);
        setSelectedAssets([]);
        setSelectMode(false);
      },
      destructive: true,
    });
  };

  // ── Bulk download ──────────────────────────────────────────────────────────
  const bulkDownloadAssets = () => {
    if (!selectedAssets.length) return;
    if (selectedAssets.length <= 5) {
      selectedAssets.forEach((id) => {
        const a = assets.find((x) => x.public_id === id);
        if (a) window.open(a.secure_url, '_blank');
      });
      toast.success(`Opened ${selectedAssets.length} assets`);
    } else {
      const urls = selectedAssets
        .map((id) => assets.find((x) => x.public_id === id)?.secure_url)
        .filter(Boolean);
      const blob = new Blob([urls.join('\n')], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'sologram-assets.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(`Download list created (${urls.length} URLs)`);
    }
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success('URL copied'))
      .catch(() => toast.error('Failed to copy URL'));
  };

  const handleFilterChange = (name, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      type: 'all',
      dateRange: 'all',
      startDate: null,
      endDate: null,
    });
    setPage(1);
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const groupedAssets = groupAssetsByDate(assets);
  const groupEntries = Object.entries(groupedAssets);
  const lastGroupKey = groupEntries[groupEntries.length - 1]?.[0];
  const activeFilters = filters.type !== 'all' || filters.dateRange !== 'all';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Page>
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <PageHeader>
        <HeaderLeft>
          <HeaderIcon>
            <FaLayerGroup />
          </HeaderIcon>
          <div>
            <HeaderTitle>Media Library</HeaderTitle>
            <HeaderSub>Cloudinary asset manager</HeaderSub>
          </div>
        </HeaderLeft>

        <HeaderRight>
          <StatPill>
            <StatNum>{stats.total}</StatNum>
            <StatLbl>assets</StatLbl>
          </StatPill>
          <StatPill>
            <StatNum>{stats.images}</StatNum>
            <StatLbl>photos</StatLbl>
          </StatPill>
          <StatPill>
            <StatNum>{stats.videos}</StatNum>
            <StatLbl>videos</StatLbl>
          </StatPill>
          <StatPill $accent>
            <StatNum>{formatFileSize(stats.storage)}</StatNum>
            <StatLbl>used</StatLbl>
          </StatPill>
        </HeaderRight>
      </PageHeader>

      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <Toolbar>
        <ToolBtn
          onClick={() => setFilterOpen((v) => !v)}
          $active={filterOpen || activeFilters}
        >
          <FaFilter />
          Filters
          {activeFilters && <ActiveDot />}
        </ToolBtn>

        <ToolBtn
          onClick={toggleSelectMode}
          $active={selectMode}
          $salmon={selectMode}
        >
          {selectMode ? <FaCheckSquare /> : <FaSquare />}
          {selectMode ? 'Exit Select' : 'Select'}
        </ToolBtn>

        {selectMode && selectedAssets.length > 0 && (
          <SelectCount>{selectedAssets.length} selected</SelectCount>
        )}
        {selectMode && assets.length > 0 && (
          <>
            <QuickBtn
              onClick={() => setSelectedAssets(assets.map((a) => a.public_id))}
            >
              All
            </QuickBtn>
            <QuickBtn onClick={() => setSelectedAssets([])}>None</QuickBtn>
          </>
        )}
      </Toolbar>

      {/* ── Filter panel ─────────────────────────────────────────────────── */}
      {filterOpen && (
        <FilterPanel>
          <FilterRow>
            <FilterGroup>
              <FilterLabel>
                <FaImage /> Type
              </FilterLabel>
              <PillGroup>
                {['all', 'image', 'video'].map((v) => (
                  <FilterPill
                    key={v}
                    $active={filters.type === v}
                    onClick={() => handleFilterChange('type', v)}
                  >
                    {v === 'all' ? 'All' : v === 'image' ? 'Photos' : 'Videos'}
                  </FilterPill>
                ))}
              </PillGroup>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>
                <FaCalendarAlt /> Date
              </FilterLabel>
              <PillGroup>
                {[
                  { v: 'all', l: 'All time' },
                  { v: 'today', l: 'Today' },
                  { v: 'thisWeek', l: 'This week' },
                  { v: 'thisMonth', l: 'This month' },
                  { v: 'custom', l: 'Custom' },
                ].map(({ v, l }) => (
                  <FilterPill
                    key={v}
                    $active={filters.dateRange === v}
                    onClick={() => handleFilterChange('dateRange', v)}
                  >
                    {l}
                  </FilterPill>
                ))}
              </PillGroup>
            </FilterGroup>
          </FilterRow>

          {filters.dateRange === 'custom' && (
            <DateRow>
              <DateInput
                type='date'
                value={filters.startDate || ''}
                onChange={(e) =>
                  handleFilterChange('startDate', e.target.value)
                }
              />
              <DateSep>→</DateSep>
              <DateInput
                type='date'
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </DateRow>
          )}

          <FilterFooter>
            <ResetBtn onClick={resetFilters}>Reset</ResetBtn>
            <ApplyBtn onClick={() => setFilterOpen(false)}>Apply</ApplyBtn>
          </FilterFooter>
        </FilterPanel>
      )}

      {/* ── Grid / states ─────────────────────────────────────────────────── */}
      {loading && page === 1 ? (
        <LoadingSpinner text='Loading assets' size='60px' height='400px' />
      ) : error ? (
        <EmptyState $error>
          <EmptyIcon $error>
            <FaImage />
          </EmptyIcon>
          <EmptyTitle>Failed to load</EmptyTitle>
          <EmptyText>{error}</EmptyText>
        </EmptyState>
      ) : assets.length === 0 ? (
        <EmptyState>
          <EmptyIcon>
            <FaImage />
          </EmptyIcon>
          <EmptyTitle>No assets found</EmptyTitle>
          <EmptyText>Try adjusting your filters</EmptyText>
        </EmptyState>
      ) : (
        groupEntries.map(([dateKey, group], groupIdx) => (
          <DateSection key={dateKey}>
            <SectionHeading>
              <SectionLabel>{group.label}</SectionLabel>
              <SectionCount>{group.assets.length}</SectionCount>
              <SectionLine />
            </SectionHeading>

            <GalleryGrid>
              {group.assets.map((asset, idx) => {
                const isLast =
                  groupIdx === groupEntries.length - 1 &&
                  idx === group.assets.length - 1;
                const checked = selectedAssets.includes(asset.public_id);

                return (
                  <GridItem
                    key={asset.public_id}
                    ref={isLast ? lastItemRef : null}
                    onClick={() =>
                      selectMode
                        ? toggleAssetSelection(
                            { stopPropagation: () => {} },
                            asset.public_id
                          )
                        : setSelectedAsset(asset)
                    }
                    $checked={checked}
                    $index={idx % 20}
                  >
                    {asset.resource_type === 'image' ? (
                      <ItemImg
                        src={getTransformedImageUrl(asset.secure_url, {
                          width: 400,
                          height: 400,
                          crop: 'fill',
                          quality: 'auto',
                          format: 'auto',
                        })}
                        alt={asset.public_id}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                    ) : (
                      <VideoThumb>
                        <ItemImg
                          src={getTransformedImageUrl(
                            asset.secure_url.replace(/\.[^.]+$/, '.jpg'),
                            {
                              width: 400,
                              height: 400,
                              crop: 'fill',
                              quality: 'auto',
                            }
                          )}
                          alt={asset.public_id}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                        <VideoPlay>
                          <FaVideo />
                        </VideoPlay>
                      </VideoThumb>
                    )}

                    {/* Hover info overlay */}
                    <ItemOverlay>
                      <OverlayDate>{formatDate(asset.created_at)}</OverlayDate>
                      <OverlaySize>{formatFileSize(asset.bytes)}</OverlaySize>
                    </ItemOverlay>

                    {/* Selection checkbox */}
                    {(selectMode || checked) && (
                      <CheckOverlay
                        $checked={checked}
                        onClick={(e) =>
                          toggleAssetSelection(e, asset.public_id)
                        }
                      >
                        {checked ? <FaCheckSquare /> : <FaSquare />}
                      </CheckOverlay>
                    )}
                  </GridItem>
                );
              })}
            </GalleryGrid>
          </DateSection>
        ))
      )}

      {loadingMore && (
        <LoadingSpinner
          text='Loading more'
          size='40px'
          height='100px'
          textSize='0.82rem'
        />
      )}

      {/* ── Asset detail modal ────────────────────────────────────────────── */}
      {selectedAsset && (
        <Modal onClick={() => setSelectedAsset(null)}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalHead>
              <ModalTitle>Asset Details</ModalTitle>
              <CloseBtn onClick={() => setSelectedAsset(null)}>
                <FaTimes />
              </CloseBtn>
            </ModalHead>

            <ModalBody>
              <ModalPreview>
                {selectedAsset.resource_type === 'image' ? (
                  <ModalImg
                    src={getTransformedImageUrl(selectedAsset.secure_url, {
                      width: 800,
                      height: 800,
                      crop: 'limit',
                      quality: 'auto',
                      format: 'auto',
                    })}
                    alt={selectedAsset.public_id}
                  />
                ) : (
                  <ModalVid controls>
                    <source
                      src={selectedAsset.secure_url}
                      type={`video/${selectedAsset.format || 'mp4'}`}
                    />
                  </ModalVid>
                )}
              </ModalPreview>

              <MetaPanel>
                {[
                  { label: 'ID', value: selectedAsset.public_id },
                  { label: 'Folder', value: selectedAsset.folder || 'Root' },
                  {
                    label: 'Type',
                    value: `${selectedAsset.resource_type} / ${selectedAsset.format}`,
                  },
                  {
                    label: 'Uploaded',
                    value: formatDate(selectedAsset.created_at),
                  },
                  { label: 'Size', value: formatFileSize(selectedAsset.bytes) },
                  {
                    label: 'Dimensions',
                    value: `${selectedAsset.width} × ${selectedAsset.height}px`,
                  },
                  {
                    label: 'URL',
                    value: selectedAsset.secure_url,
                    breakAll: true,
                  },
                ].map(({ label, value, breakAll }) => (
                  <MetaRow key={label}>
                    <MetaLabel>{label}</MetaLabel>
                    <MetaValue $breakAll={breakAll}>{value}</MetaValue>
                  </MetaRow>
                ))}
              </MetaPanel>
            </ModalBody>

            <ModalFoot>
              <FootBtn onClick={() => handleCopyUrl(selectedAsset.secure_url)}>
                <FaCopy /> Copy URL
              </FootBtn>
              <FootBtn
                as='a'
                href={selectedAsset.secure_url}
                download
                target='_blank'
                rel='noopener noreferrer'
                $mint
              >
                <FaDownload /> Download
              </FootBtn>
              <FootBtn
                $danger
                onClick={() => handleDeleteAsset(selectedAsset.public_id)}
              >
                <FaTrash /> Delete
              </FootBtn>
            </ModalFoot>
          </ModalCard>
        </Modal>
      )}

      {/* ── Bulk action bar ───────────────────────────────────────────────── */}
      {selectedAssets.length > 0 && (
        <BulkBar>
          <BulkInfo>
            <BulkCount>
              <strong>{selectedAssets.length}</strong> selected
            </BulkCount>
          </BulkInfo>
          <BulkActions>
            <BulkBtn onClick={bulkDownloadAssets}>
              <FaDownload /> Download
            </BulkBtn>
            <BulkBtn $danger onClick={bulkDeleteAssets}>
              <FaTrash /> Delete
            </BulkBtn>
          </BulkActions>
        </BulkBar>
      )}
    </Page>
  );
};

export default CloudinaryGallery;

// ─── Animations ───────────────────────────────────────────────────────────────

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0);    }
`;

const shimmer = keyframes`
  0%   { background-position: -600px 0; }
  100% { background-position:  600px 0; }
`;

const slideUp = keyframes`
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
`;

// ─── Page shell ───────────────────────────────────────────────────────────────

const Page = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 24px 120px;
  background: ${COLORS.background};
  min-height: 100vh;

  @media (max-width: 768px) {
    padding: 16px 16px 120px;
  }
`;

// ─── Header ───────────────────────────────────────────────────────────────────

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const HeaderIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 1.1rem;
  box-shadow: 0 6px 16px ${COLORS.primarySalmon}44;
  flex-shrink: 0;
`;

const HeaderTitle = styled.h1`
  font-size: 1.4rem;
  font-weight: 800;
  color: ${COLORS.textPrimary};
  letter-spacing: -0.03em;
  margin: 0 0 2px;
`;

const HeaderSub = styled.p`
  font-size: 0.72rem;
  font-weight: 500;
  color: ${COLORS.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin: 0;
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const StatPill = styled.div`
  background: ${(p) =>
    p.$accent
      ? `linear-gradient(135deg, ${COLORS.primarySalmon}22, ${COLORS.primaryMint}22)`
      : COLORS.cardBackground};
  border: 1px solid
    ${(p) => (p.$accent ? COLORS.primarySalmon + '44' : COLORS.border)};
  border-radius: 10px;
  padding: 8px 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
`;

const StatNum = styled.span`
  font-size: 1rem;
  font-weight: 700;
  color: ${COLORS.primarySalmon};
  line-height: 1;
`;

const StatLbl = styled.span`
  font-size: 0.65rem;
  font-weight: 600;
  color: ${COLORS.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
`;

// ─── Toolbar ──────────────────────────────────────────────────────────────────

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
`;

const ToolBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 16px;
  border-radius: 20px;
  border: 1px solid
    ${(p) => (p.$active ? COLORS.primarySalmon + '88' : COLORS.border)};
  background: ${(p) =>
    p.$salmon
      ? `linear-gradient(135deg, ${COLORS.primarySalmon}, ${COLORS.accentSalmon})`
      : p.$active
      ? COLORS.primarySalmon + '15'
      : COLORS.cardBackground};
  color: ${(p) =>
    p.$salmon
      ? '#fff'
      : p.$active
      ? COLORS.primarySalmon
      : COLORS.textSecondary};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  position: relative;
  transition: all 0.2s;

  &:hover {
    border-color: ${COLORS.primarySalmon};
    color: ${(p) => (p.$salmon ? '#fff' : COLORS.primarySalmon)};
    background: ${(p) =>
      p.$salmon
        ? `linear-gradient(135deg, ${COLORS.accentSalmon}, ${COLORS.primarySalmon})`
        : COLORS.primarySalmon + '12'};
  }
`;

const ActiveDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${COLORS.primarySalmon};
  position: absolute;
  top: 5px;
  right: 5px;
`;

const SelectCount = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${COLORS.primarySalmon};
  padding: 0 4px;
`;

const QuickBtn = styled.button`
  background: none;
  border: 1px solid ${COLORS.border};
  color: ${COLORS.textTertiary};
  font-size: 0.75rem;
  font-weight: 600;
  padding: 7px 12px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: ${COLORS.primarySalmon};
    color: ${COLORS.primarySalmon};
  }
`;

// ─── Filter panel ─────────────────────────────────────────────────────────────

const FilterPanel = styled.div`
  background: ${COLORS.cardBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  animation: ${fadeUp} 0.2s ease;
`;

const FilterRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
  margin-bottom: 16px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const FilterLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  font-weight: 700;
  color: ${COLORS.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.6px;

  svg {
    color: ${COLORS.primaryMint};
  }
`;

const PillGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const FilterPill = styled.button`
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid ${(p) => (p.$active ? COLORS.primarySalmon : COLORS.border)};
  background: ${(p) =>
    p.$active
      ? `linear-gradient(135deg, ${COLORS.primarySalmon}, ${COLORS.accentSalmon})`
      : 'transparent'};
  color: ${(p) => (p.$active ? '#fff' : COLORS.textSecondary)};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
  box-shadow: ${(p) =>
    p.$active ? `0 4px 12px ${COLORS.primarySalmon}44` : 'none'};

  &:hover {
    border-color: ${COLORS.primarySalmon};
    color: ${(p) => (p.$active ? '#fff' : COLORS.primarySalmon)};
  }
`;

const DateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;

  @media (max-width: 540px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const DateSep = styled.span`
  color: ${COLORS.textTertiary};
  font-size: 0.9rem;
  @media (max-width: 540px) {
    display: none;
  }
`;

const DateInput = styled.input`
  flex: 1;
  padding: 9px 12px;
  background: ${COLORS.elevatedBackground};
  border: 1px solid ${COLORS.border};
  border-radius: 10px;
  color: ${COLORS.textPrimary};
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: ${COLORS.primarySalmon};
    box-shadow: 0 0 0 3px ${COLORS.primarySalmon}22;
  }
`;

const FilterFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 16px;
  border-top: 1px solid ${COLORS.border};
`;

const ResetBtn = styled.button`
  padding: 8px 18px;
  border: 1px solid ${COLORS.border};
  border-radius: 20px;
  background: none;
  color: ${COLORS.textSecondary};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: ${COLORS.textSecondary};
    color: ${COLORS.textPrimary};
  }
`;

const ApplyBtn = styled.button`
  padding: 8px 22px;
  border-radius: 20px;
  border: none;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.accentSalmon}
  );
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px ${COLORS.primarySalmon}44;
  transition: opacity 0.2s, transform 0.2s;
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
`;

// ─── Date sections ────────────────────────────────────────────────────────────

const DateSection = styled.section`
  margin-bottom: 32px;
`;

const SectionHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
`;

const SectionLabel = styled.h2`
  font-size: 0.82rem;
  font-weight: 800;
  color: ${COLORS.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.8px;
  margin: 0;
  white-space: nowrap;
`;

const SectionCount = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${COLORS.primarySalmon};
  background: ${COLORS.primarySalmon}18;
  border: 1px solid ${COLORS.primarySalmon}44;
  padding: 2px 9px;
  border-radius: 20px;
  white-space: nowrap;
`;

const SectionLine = styled.div`
  flex: 1;
  height: 1px;
  background: ${COLORS.border};
`;

// ─── Gallery grid ─────────────────────────────────────────────────────────────

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;

  @media (max-width: 600px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
`;

const GridItem = styled.div`
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: ${COLORS.cardBackground};
  border: 2px solid
    ${(p) => (p.$checked ? COLORS.primarySalmon : 'transparent')};
  box-shadow: ${(p) =>
    p.$checked ? `0 0 0 1px ${COLORS.primarySalmon}` : 'none'};
  animation: ${fadeUp} 0.3s ease both;
  animation-delay: ${(p) => p.$index * 0.03}s;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35),
      0 0 0 1px ${COLORS.primarySalmon}44;
  }

  &:hover .overlay {
    opacity: 1;
  }
`;

const ItemImg = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s ease;

  ${GridItem}:hover & {
    transform: scale(1.04);
  }
`;

const VideoThumb = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

const VideoPlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(
    135deg,
    ${COLORS.primarySalmon},
    ${COLORS.primaryMint}
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.9rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 2;
  transition: transform 0.2s;

  ${GridItem}:hover & {
    transform: translate(-50%, -50%) scale(1.1);
  }
`;

const ItemOverlay = styled.div.attrs(() => ({ className: 'overlay' }))`
  position: absolute;
  inset: auto 0 0 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.78) 0%, transparent 100%);
  padding: 20px 10px 10px;
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

const OverlayDate = styled.span`
  font-size: 0.68rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.88);
`;

const OverlaySize = styled.span`
  font-size: 0.65rem;
  color: rgba(255, 255, 255, 0.6);
`;

const CheckOverlay = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 5;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: ${(p) =>
    p.$checked ? COLORS.primarySalmon : 'rgba(0,0,0,0.55)'};
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 0.8rem;
  cursor: pointer;
  transition: background 0.18s, transform 0.18s;
  box-shadow: ${(p) =>
    p.$checked ? `0 0 0 2px ${COLORS.primarySalmon}` : 'none'};

  &:hover {
    transform: scale(1.12);
    background: ${COLORS.primarySalmon};
  }
`;

// ─── Empty / error states ─────────────────────────────────────────────────────

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  text-align: center;
  background: ${COLORS.cardBackground};
  border-radius: 16px;
  border: 1px solid ${COLORS.border};
  margin-top: 16px;
`;

const EmptyIcon = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: ${(p) =>
    p.$error ? `${COLORS.error}18` : COLORS.elevatedBackground};
  border: 1px solid ${(p) => (p.$error ? `${COLORS.error}44` : COLORS.border)};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  color: ${(p) => (p.$error ? COLORS.error : COLORS.textTertiary)};
  margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
  font-size: 1rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  margin: 0 0 6px;
`;

const EmptyText = styled.p`
  font-size: 0.875rem;
  color: ${COLORS.textSecondary};
  max-width: 320px;
  line-height: 1.5;
  margin: 0;
`;

// ─── Asset detail modal ───────────────────────────────────────────────────────

const Modal = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;

  @media (max-width: 768px) {
    align-items: flex-start;
    padding: 12px;
  }
`;

const ModalCard = styled.div`
  background: ${COLORS.cardBackground};
  border-radius: 16px;
  overflow: hidden;
  width: 100%;
  max-width: 960px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border: 1px solid ${COLORS.border};
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.6);
  animation: ${fadeUp} 0.25s ease;
`;

const ModalHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid ${COLORS.border};
  background: ${COLORS.elevatedBackground};
`;

const ModalTitle = styled.h2`
  font-size: 1rem;
  font-weight: 700;
  color: ${COLORS.textPrimary};
  letter-spacing: -0.01em;
  margin: 0;
`;

const CloseBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.07);
  color: ${COLORS.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
  &:hover {
    background: rgba(255, 255, 255, 0.14);
    color: ${COLORS.textPrimary};
  }
`;

const ModalBody = styled.div`
  display: flex;
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  gap: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ModalPreview = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${COLORS.elevatedBackground};
  border-radius: 10px;
  overflow: hidden;
  min-height: 280px;
  border: 1px solid ${COLORS.border};
`;

const ModalImg = styled.img`
  max-width: 100%;
  max-height: 480px;
  object-fit: contain;
`;

const ModalVid = styled.video`
  max-width: 100%;
  max-height: 480px;
`;

const MetaPanel = styled.div`
  flex: 0 0 280px;
  display: flex;
  flex-direction: column;
  gap: 0;
  background: ${COLORS.elevatedBackground};
  border-radius: 10px;
  border: 1px solid ${COLORS.border};
  overflow: hidden;

  @media (max-width: 768px) {
    flex: 1;
  }
`;

const MetaRow = styled.div`
  padding: 11px 14px;
  border-bottom: 1px solid ${COLORS.border};
  &:last-child {
    border-bottom: none;
  }
`;

const MetaLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 700;
  color: ${COLORS.textTertiary};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: 3px;
`;

const MetaValue = styled.div`
  font-size: 0.8rem;
  color: ${COLORS.textPrimary};
  word-break: ${(p) => (p.$breakAll ? 'break-all' : 'normal')};
  line-height: 1.4;
`;

const ModalFoot = styled.div`
  display: flex;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid ${COLORS.border};
  background: ${COLORS.elevatedBackground};
  justify-content: flex-end;

  @media (max-width: 480px) {
    justify-content: stretch;
    > * {
      flex: 1;
      justify-content: center;
    }
  }
`;

const FootBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 20px;
  border: 1px solid
    ${(p) =>
      p.$danger
        ? `${COLORS.error}66`
        : p.$mint
        ? `${COLORS.primaryMint}66`
        : COLORS.border};
  background: ${(p) =>
    p.$danger
      ? `${COLORS.error}15`
      : p.$mint
      ? `${COLORS.primaryMint}15`
      : 'transparent'};
  color: ${(p) =>
    p.$danger
      ? COLORS.error
      : p.$mint
      ? COLORS.primaryMint
      : COLORS.textSecondary};
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;

  &:hover {
    background: ${(p) =>
      p.$danger
        ? `${COLORS.error}28`
        : p.$mint
        ? `${COLORS.primaryMint}28`
        : COLORS.elevatedBackground};
    color: ${(p) =>
      p.$danger
        ? COLORS.error
        : p.$mint
        ? COLORS.primaryMint
        : COLORS.textPrimary};
    transform: translateY(-1px);
  }
`;

// ─── Bulk action bar ──────────────────────────────────────────────────────────

const BulkBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: ${COLORS.cardBackground};
  border-top: 1px solid ${COLORS.border};
  backdrop-filter: blur(12px);
  padding: 14px 24px;
  padding-bottom: calc(14px + env(safe-area-inset-bottom, 0));
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 200;
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.3);
  animation: ${slideUp} 0.25s cubic-bezier(0.22, 1, 0.36, 1);

  /* Leave room for AppNav on mobile */
  @media (max-width: 768px) {
    bottom: 60px;
    padding: 12px 16px;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 10px;
    bottom: 60px;
  }
`;

const BulkInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const BulkCount = styled.span`
  font-size: 0.875rem;
  color: ${COLORS.textSecondary};

  strong {
    color: ${COLORS.primarySalmon};
    font-size: 1rem;
  }
`;

const BulkActions = styled.div`
  display: flex;
  gap: 8px;

  @media (max-width: 480px) {
    width: 100%;
    > * {
      flex: 1;
      justify-content: center;
    }
  }
`;

const BulkBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 20px;
  border-radius: 20px;
  border: none;
  background: ${(p) =>
    p.$danger
      ? `linear-gradient(135deg, ${COLORS.error}, #cc4444)`
      : `linear-gradient(135deg, ${COLORS.primarySalmon}, ${COLORS.accentSalmon})`};
  color: #fff;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  box-shadow: ${(p) =>
    p.$danger
      ? `0 4px 14px ${COLORS.error}44`
      : `0 4px 14px ${COLORS.primarySalmon}44`};
  transition: opacity 0.2s, transform 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }
`;
