// CloudinaryGallery.js with integrated components

import React, { useState, useEffect, useCallback, useContext } from "react";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
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
} from "react-icons/fa";
import { getTransformedImageUrl } from "../utils/cloudinary";
import { COLORS } from "../theme";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import DeleteConfirmationModal from "../components/common/DeleteConfirmationModal";
import LoadingSpinner from "../components/common/LoadingSpinner";

const CloudinaryGallery = () => {
  // Use the existing auth context
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [filters, setFilters] = useState({
    type: "all", // all, image, video
    dateRange: "all", // all, today, thisWeek, thisMonth, custom
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
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    show: false,
    assetId: null,
    assetName: null,
    isBulk: false,
    count: 0,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // Verify admin status using the existing auth context
  useEffect(() => {
    // Redirect if not admin
    if (user && user.role !== "admin") {
      toast.error("You need admin privileges to access this page");
      navigate("/");
    }
  }, [user, navigate]);

  // Load assets from Cloudinary
  useEffect(() => {
    fetchAssets();
  }, [page, filters]);

  // Toggle selection mode
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    if (selectMode) {
      setSelectedAssets([]);
      setBulkActionOpen(false);
    }
  };

  // Toggle selection of an asset
  const toggleAssetSelection = (e, assetId) => {
    e.stopPropagation(); // Prevent opening the asset modal

    if (selectedAssets.includes(assetId)) {
      setSelectedAssets(selectedAssets.filter((id) => id !== assetId));
    } else {
      setSelectedAssets([...selectedAssets, assetId]);
    }
  };

  // Select all visible assets
  const selectAllAssets = () => {
    const allVisibleIds = assets.map((asset) => asset.public_id);
    setSelectedAssets(allVisibleIds);
  };

  // Deselect all assets
  const deselectAllAssets = () => {
    setSelectedAssets([]);
  };

  // Perform bulk delete
  const bulkDeleteAssets = async () => {
    if (selectedAssets.length === 0) return;

    // Show the delete confirmation modal
    setDeleteConfirmation({
      show: true,
      assetId: null,
      assetName: null,
      isBulk: true,
      count: selectedAssets.length,
    });
  };

  // Bulk download assets
  const bulkDownloadAssets = () => {
    if (selectedAssets.length === 0) return;

    // For smaller selections, open each in a new tab
    if (selectedAssets.length <= 5) {
      selectedAssets.forEach((publicId) => {
        const asset = assets.find((asset) => asset.public_id === publicId);
        if (asset) {
          window.open(asset.secure_url, "_blank");
        }
      });
      toast.success(`Opened ${selectedAssets.length} assets for download`);
    } else {
      // For larger selections, create a text file with all URLs
      const urls = selectedAssets
        .map((publicId) => {
          const asset = assets.find((asset) => asset.public_id === publicId);
          return asset ? asset.secure_url : null;
        })
        .filter(Boolean);

      const urlText = urls.join("\n");
      const blob = new Blob([urlText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "cloudinary-assets-urls.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Created download list with ${urls.length} assets`);
    }

    // Keep selection mode active for further operations
  };

  const confirmDelete = async () => {
    try {
      if (deleteConfirmation.isBulk) {
        // Bulk delete process
        const loadingToast = toast.loading(
          `Deleting ${deleteConfirmation.count} assets...`
        );

        let successCount = 0;
        let failureCount = 0;

        for (const publicId of selectedAssets) {
          try {
            await axios.delete(`/api/admin/cloudinary/${publicId}`);
            successCount++;
          } catch (error) {
            console.error(`Error deleting asset ${publicId}:`, error);
            failureCount++;
          }
        }

        // Update toast based on results
        toast.dismiss(loadingToast);
        if (failureCount === 0) {
          toast.success(`Successfully deleted ${successCount} assets`);
        } else {
          toast.error(
            `Deleted ${successCount} assets, but failed to delete ${failureCount} assets`
          );
        }

        // Refresh assets
        fetchAssets();

        // Clear selection
        setSelectedAssets([]);
        setBulkActionOpen(false);
      } else {
        // Single asset delete
        const publicId = deleteConfirmation.assetId;

        await axios.delete(`/api/admin/cloudinary/${publicId}`);
        toast.success("Asset deleted successfully");

        // Update local state
        setAssets((prev) =>
          prev.filter((asset) => asset.public_id !== publicId)
        );
        if (selectedAsset?.public_id === publicId) {
          setSelectedAsset(null);
        }

        // Update stats
        setStats((prev) => ({
          ...prev,
          total: prev.total - 1,
          images:
            selectedAsset?.resource_type === "image"
              ? prev.images - 1
              : prev.images,
          videos:
            selectedAsset?.resource_type === "video"
              ? prev.videos - 1
              : prev.videos,
        }));
      }
    } catch (error) {
      console.error("Error deleting asset:", error);

      // More descriptive error message based on error status
      if (error.response) {
        if (error.response.status === 404) {
          toast.error(
            "API endpoint not found. Check your API routes configuration."
          );
        } else if (error.response.status === 403) {
          toast.error("Cannot delete assets outside the SoloGram folder.");
        } else if (error.response.status === 400) {
          toast.error(error.response.data?.message || "Invalid request.");
        } else {
          toast.error(
            `Server error: ${error.response.data?.message || error.message}`
          );
        }
      } else {
        toast.error(
          "Failed to connect to the server. Please check your network connection."
        );
      }
    } finally {
      // Hide the confirmation modal
      setDeleteConfirmation({
        show: false,
        assetId: null,
        assetName: null,
        isBulk: false,
        count: 0,
      });
    }
  };

  const fetchAssets = async () => {
    try {
      // Set loading state
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      // Convert date filters to ISO strings for the API
      const apiFilters = { ...filters };
      if (apiFilters.startDate) {
        apiFilters.startDate = new Date(apiFilters.startDate).toISOString();
      }
      if (apiFilters.endDate) {
        apiFilters.endDate = new Date(apiFilters.endDate).toISOString();
      }

      const response = await axios.get("/api/admin/cloudinary", {
        params: {
          page,
          limit: 30,
          ...apiFilters,
        },
      });

      // Check if response has the expected data structure
      if (!response.data || !response.data.results) {
        console.error("Invalid API response format:", response.data);
        setError(
          "Invalid response from server. Please contact the administrator."
        );
        toast.error("Invalid API response format");
        return;
      }

      const { results, totalCount, hasMore, statistics } = response.data;

      if (page === 1) {
        setAssets(results || []);
      } else {
        setAssets((prev) => [...prev, ...(results || [])]);
      }

      setHasMore(!!hasMore);
      setStats({
        total: totalCount || 0,
        images: statistics?.imageCount || 0,
        videos: statistics?.videoCount || 0,
        storage: statistics?.totalStorage || 0,
      });

      // Clear any previous errors
      setError(null);
    } catch (err) {
      console.error("Error fetching Cloudinary assets:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to load media assets. Please try again.";
      setError(
        `${errorMessage} ${
          err.response?.status === 500
            ? "There might be an issue with the Cloudinary configuration."
            : ""
        }`
      );
      toast.error("Failed to load Cloudinary assets");

      // Set empty assets if it's the first page
      if (page === 1) {
        setAssets([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Handle infinite scrolling
  const observer = React.useRef();
  const lastAssetElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore]
  );

  const handleDeleteAsset = async (publicId) => {
    // Find the asset to get its name or title for the confirmation modal
    const asset = assets.find((a) => a.public_id === publicId);

    // Show the delete confirmation modal instead of using window.confirm
    setDeleteConfirmation({
      show: true,
      assetId: publicId,
      assetName: asset?.public_id.split("/").pop() || "this asset",
      isBulk: false,
      count: 0,
    });
  };

  const handleCopyUrl = (url) => {
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("URL copied to clipboard"))
      .catch(() => toast.error("Failed to copy URL"));
  };

  const handleFilterChange = (name, value) => {
    let newFilters = { ...filters, [name]: value };

    // Reset to page 1 when changing filters
    setPage(1);
    setFilters(newFilters);
  };

  const resetFilters = () => {
    setFilters({
      type: "all",
      dateRange: "all",
      startDate: null,
      endDate: null,
    });
    setPage(1);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date) => {
    return format(new Date(date), "MMM d, yyyy");
  };

  const groupAssetsByDate = (assets) => {
    const grouped = {};

    assets.forEach((asset) => {
      const date = new Date(asset.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey;
      let dateLabel;

      // Group by specific timeframes
      if (date.toDateString() === today.toDateString()) {
        dateKey = "today";
        dateLabel = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = "yesterday";
        dateLabel = "Yesterday";
      } else if (today.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
        dateKey = "thisWeek";
        dateLabel = "This Week";
      } else if (
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
      ) {
        dateKey = "thisMonth";
        dateLabel = "This Month";
      } else {
        // Format by month and year for older content
        dateKey = `${date.getFullYear()}-${date.getMonth()}`;
        dateLabel = format(date, "MMMM yyyy");
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          label: dateLabel,
          assets: [],
        };
      }

      grouped[dateKey].assets.push(asset);
    });

    // Sort keys by most recent first
    const orderedGroups = {};
    const order = ["today", "yesterday", "thisWeek", "thisMonth"];

    // Add the predefined timeframes first
    order.forEach((key) => {
      if (grouped[key]) {
        orderedGroups[key] = grouped[key];
        delete grouped[key];
      }
    });

    // Add the rest in reverse chronological order
    Object.keys(grouped)
      .sort((a, b) => b.localeCompare(a))
      .forEach((key) => {
        orderedGroups[key] = grouped[key];
      });

    return orderedGroups;
  };

  const getVariableAspectRatio = (publicId) => {
    const sum = publicId
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const options = ["1 / 1", "4 / 5", "4 / 3", "3 / 4", "16 / 9"];
    return options[sum % options.length];
  };

  // Animation variants for framer-motion
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.05,
        duration: 0.3,
        ease: "easeOut",
      },
    }),
  };

  return (
    <GalleryContainer>
      <GalleryHeader>
        <h1>Media Gallery</h1>
        <HeaderActions>
          <FilterButton onClick={() => setFilterOpen(!filterOpen)}>
            <FaFilter /> Filter
          </FilterButton>
          <SelectModeButton active={selectMode} onClick={toggleSelectMode}>
            {selectMode ? (
              <>
                <FaCheckSquare /> Exit Selection
              </>
            ) : (
              <>
                <FaSquare /> Select Items
              </>
            )}
          </SelectModeButton>
          <StatsContainer>
            <StatItem>
              <StatValue>{stats.total}</StatValue>
              <StatLabel>Total Assets</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats.images}</StatValue>
              <StatLabel>Images</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{stats.videos}</StatValue>
              <StatLabel>Videos</StatLabel>
            </StatItem>
            <StatItem>
              <StatValue>{formatFileSize(stats.storage)}</StatValue>
              <StatLabel>Storage Used</StatLabel>
            </StatItem>
          </StatsContainer>
        </HeaderActions>
      </GalleryHeader>

      {filterOpen && (
        <FilterPanel>
          <FilterHeader>
            <h3>Filter Media</h3>
            <CloseButton onClick={() => setFilterOpen(false)}>
              <FaTimes />
            </CloseButton>
          </FilterHeader>
          <FiltersGrid>
            <FilterGroup>
              <FilterLabel>
                <FaImage /> Type
              </FilterLabel>
              <FilterOptions>
                <FilterOption
                  active={filters.type === "all"}
                  onClick={() => handleFilterChange("type", "all")}
                >
                  All
                </FilterOption>
                <FilterOption
                  active={filters.type === "image"}
                  onClick={() => handleFilterChange("type", "image")}
                >
                  Images
                </FilterOption>
                <FilterOption
                  active={filters.type === "video"}
                  onClick={() => handleFilterChange("type", "video")}
                >
                  Videos
                </FilterOption>
              </FilterOptions>
            </FilterGroup>

            <FilterGroup>
              <FilterLabel>
                <FaCalendarAlt /> Date Range
              </FilterLabel>
              <FilterOptions>
                <FilterOption
                  active={filters.dateRange === "all"}
                  onClick={() => handleFilterChange("dateRange", "all")}
                >
                  All Time
                </FilterOption>
                <FilterOption
                  active={filters.dateRange === "today"}
                  onClick={() => handleFilterChange("dateRange", "today")}
                >
                  Today
                </FilterOption>
                <FilterOption
                  active={filters.dateRange === "thisWeek"}
                  onClick={() => handleFilterChange("dateRange", "thisWeek")}
                >
                  This Week
                </FilterOption>
                <FilterOption
                  active={filters.dateRange === "thisMonth"}
                  onClick={() => handleFilterChange("dateRange", "thisMonth")}
                >
                  This Month
                </FilterOption>
                <FilterOption
                  active={filters.dateRange === "custom"}
                  onClick={() => handleFilterChange("dateRange", "custom")}
                >
                  Custom Range
                </FilterOption>
              </FilterOptions>
            </FilterGroup>

            {filters.dateRange === "custom" && (
              <CustomDateRange>
                <DateInput
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  placeholder="Start Date"
                />
                <DateInput
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  placeholder="End Date"
                />
              </CustomDateRange>
            )}
          </FiltersGrid>
          <FilterActions>
            <ResetButton onClick={resetFilters}>Reset Filters</ResetButton>
            <ApplyButton onClick={() => setFilterOpen(false)}>
              Apply Filters
            </ApplyButton>
          </FilterActions>
        </FilterPanel>
      )}

      {loading && page === 1 ? (
        <LoadingContainer>
          <LoadingSpinner
            text="Loading media assets"
            size="60px"
            height="400px"
          />
        </LoadingContainer>
      ) : error ? (
        <ErrorMessage>{error}</ErrorMessage>
      ) : assets.length > 0 ? (
        <>
          {Object.entries(groupAssetsByDate(assets)).map(([dateKey, group]) => (
            <DateSection key={dateKey}>
              <DateHeading>
                {group.label}
                <DateCount>{group.assets.length}</DateCount>
              </DateHeading>
              <GalleryGrid>
                {group.assets.map((asset, index) => (
                  <GalleryItem
                    ref={
                      group.assets.length === index + 1 &&
                      Object.keys(groupAssetsByDate(assets)).pop() === dateKey
                        ? lastAssetElementRef
                        : null
                    }
                    key={asset.public_id}
                    onClick={() => setSelectedAsset(asset)}
                    aspectRatio={getVariableAspectRatio(asset.public_id)}
                    initial="hidden"
                    animate="visible"
                    custom={index % 20} // Stagger animation in groups of 20
                    variants={itemVariants}
                    whileHover={{
                      y: -5,
                      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)",
                      zIndex: 2,
                    }}
                  >
                    {asset.resource_type === "image" ? (
                      <GalleryImage
                        src={getTransformedImageUrl(asset.secure_url, {
                          width: 400,
                          height: 400,
                          crop: "fill",
                          quality: "auto",
                          format: "auto",
                        })}
                        alt={asset.public_id}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="300" height="300"><rect width="24" height="24" fill="%23f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="3" text-anchor="middle" fill="%23999">Image Error</text></svg>';
                        }}
                      />
                    ) : (
                      <VideoThumbnail>
                        <VideoIcon>
                          <FaVideo />
                        </VideoIcon>
                        <VideoPreview
                          src={getTransformedImageUrl(
                            asset.secure_url.replace(/\.[^.]+$/, ".jpg"),
                            {
                              width: 400,
                              height: 400,
                              crop: "fill",
                              quality: "auto",
                              format: "auto",
                            }
                          )}
                          alt={asset.public_id}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="300" height="300"><rect width="24" height="24" fill="%23f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="3" text-anchor="middle" fill="%23999">Video</text></svg>';
                          }}
                        />
                      </VideoThumbnail>
                    )}
                    <ItemOverlay className="item-overlay">
                      <OverlayInfo>
                        <AssetDate>{formatDate(asset.created_at)}</AssetDate>
                        <AssetSize>{formatFileSize(asset.bytes)}</AssetSize>
                      </OverlayInfo>
                    </ItemOverlay>
                    {(selectMode ||
                      selectedAssets.includes(asset.public_id)) && (
                      <SelectionOverlay
                        visible={
                          selectMode || selectedAssets.includes(asset.public_id)
                        }
                        onClick={(e) =>
                          toggleAssetSelection(e, asset.public_id)
                        }
                      >
                        {selectedAssets.includes(asset.public_id) ? (
                          <FaCheckSquare />
                        ) : (
                          <FaSquare />
                        )}
                      </SelectionOverlay>
                    )}
                  </GalleryItem>
                ))}
              </GalleryGrid>
            </DateSection>
          ))}
          {loadingMore && (
            <LoadingMoreContainer>
              <LoadingSpinner
                text="Loading more assets"
                size="40px"
                height="120px"
                textSize="0.875rem"
              />
            </LoadingMoreContainer>
          )}
        </>
      ) : (
        <NoAssetsMessage>
          No media assets found with the current filters
        </NoAssetsMessage>
      )}

      {selectedAsset && (
        <AssetModal onClick={() => setSelectedAsset(null)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>Asset Details</ModalTitle>
              <CloseButton onClick={() => setSelectedAsset(null)}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <AssetPreview>
                {selectedAsset.resource_type === "image" ? (
                  <PreviewImage
                    src={getTransformedImageUrl(selectedAsset.secure_url, {
                      width: 800,
                      height: 800,
                      crop: "limit",
                      quality: "auto",
                    })}
                    alt={selectedAsset.public_id}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="800" height="800"><rect width="24" height="24" fill="%23f0f0f0"/><text x="50%" y="50%" font-family="Arial" font-size="3" text-anchor="middle" fill="%23999">Image Error</text></svg>';
                    }}
                  />
                ) : (
                  <PreviewVideo controls>
                    <source
                      src={selectedAsset.secure_url}
                      type={
                        selectedAsset.format
                          ? `video/${selectedAsset.format}`
                          : "video/mp4"
                      }
                    />
                    Your browser does not support the video tag.
                  </PreviewVideo>
                )}
              </AssetPreview>
              <AssetInfo>
                <InfoGroup>
                  <InfoLabel>ID:</InfoLabel>
                  <InfoValue>{selectedAsset.public_id}</InfoValue>
                </InfoGroup>
                <InfoGroup>
                  <InfoLabel>Folder Path:</InfoLabel>
                  <InfoValue>{selectedAsset.folder || "Root folder"}</InfoValue>
                </InfoGroup>
                <InfoGroup>
                  <InfoLabel>Type:</InfoLabel>
                  <InfoValue>
                    {selectedAsset.resource_type} / {selectedAsset.format}
                  </InfoValue>
                </InfoGroup>
                <InfoGroup>
                  <InfoLabel>Uploaded:</InfoLabel>
                  <InfoValue>{formatDate(selectedAsset.created_at)}</InfoValue>
                </InfoGroup>
                <InfoGroup>
                  <InfoLabel>Size:</InfoLabel>
                  <InfoValue>{formatFileSize(selectedAsset.bytes)}</InfoValue>
                </InfoGroup>
                <InfoGroup>
                  <InfoLabel>Dimensions:</InfoLabel>
                  <InfoValue>
                    {selectedAsset.width} x {selectedAsset.height}px
                  </InfoValue>
                </InfoGroup>
                <InfoGroup>
                  <InfoLabel>URL:</InfoLabel>
                  <InfoValue className="url">
                    {selectedAsset.secure_url}
                  </InfoValue>
                </InfoGroup>
              </AssetInfo>
            </ModalBody>
            <ModalFooter>
              <ActionButton
                onClick={() => handleCopyUrl(selectedAsset.secure_url)}
                color={COLORS.info}
              >
                <FaCopy /> <span>Copy URL</span>
              </ActionButton>
              <ActionButton
                as="a"
                href={selectedAsset.secure_url}
                download
                target="_blank"
                rel="noopener noreferrer"
                color={COLORS.success}
              >
                <FaDownload /> <span>Download</span>
              </ActionButton>
              <ActionButton
                onClick={() => handleDeleteAsset(selectedAsset.public_id)}
                color={COLORS.error}
              >
                <FaTrash /> <span>Delete</span>
              </ActionButton>
            </ModalFooter>
          </ModalContent>
        </AssetModal>
      )}
      {selectedAssets.length > 0 && (
        <BulkActionBar visible={selectedAssets.length > 0}>
          <BulkInfo>
            <SelectedCount>
              Selected <span>{selectedAssets.length}</span> items
            </SelectedCount>
            <SelectionActions>
              <SelectionAction onClick={selectAllAssets}>
                Select All
              </SelectionAction>
              <SelectionAction onClick={deselectAllAssets}>
                Clear
              </SelectionAction>
            </SelectionActions>
          </BulkInfo>
          <BulkActions>
            <BulkActionButton onClick={bulkDownloadAssets}>
              <FaDownload /> Download
            </BulkActionButton>
            <BulkActionButton danger onClick={bulkDeleteAssets}>
              <FaTrash /> Delete
            </BulkActionButton>
          </BulkActions>
        </BulkActionBar>
      )}

      {/* Using the new DeleteConfirmationModal component */}
      <DeleteConfirmationModal
        show={deleteConfirmation.show}
        onCancel={() =>
          setDeleteConfirmation({
            show: false,
            assetId: null,
            assetName: null,
            isBulk: false,
            count: 0,
          })
        }
        onConfirm={confirmDelete}
        assetName={deleteConfirmation.assetName}
        isBulk={deleteConfirmation.isBulk}
        count={deleteConfirmation.count}
      />
    </GalleryContainer>
  );
};

// Styled Components
const GalleryContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const GalleryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;

  h1 {
    color: ${COLORS.textPrimary};
    font-weight: 700;
    font-size: 1.75rem;
    margin: 0;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;

    h1 {
      font-size: 1.5rem;
    }
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${COLORS.primaryBlueGray};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: ${COLORS.accentBlueGray};
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 767px) {
    width: 100%;
    justify-content: center;
    padding: 0.75rem;
    border-radius: 6px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const StatsContainer = styled.div`
  display: flex;
  gap: 1.5rem;
  background-color: ${COLORS.cardBackground};
  padding: 0.75rem 1.25rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px ${COLORS.shadow};

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    gap: 0.75rem;
    margin-top: 0.5rem;
    overflow-x: hidden;
  }
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 768px) {
    flex: 0 0 calc(50% - 0.5rem);
    margin-bottom: 0.5rem;
  }
`;

const StatValue = styled.div`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${COLORS.primaryBlueGray};

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: ${COLORS.textSecondary};

  @media (max-width: 768px) {
    font-size: 0.75rem;
  }
`;

const FilterPanel = styled.div`
  margin-bottom: 2rem;
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  box-shadow: 0 2px 8px ${COLORS.shadow};
  overflow: hidden;
`;

const FilterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background-color: ${COLORS.elevatedBackground};
  border-bottom: 1px solid ${COLORS.border};

  h3 {
    margin: 0;
    color: ${COLORS.textPrimary};
    font-size: 1.125rem;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textTertiary};
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.3s, color 0.3s;

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.textPrimary};
  }
`;

const FiltersGrid = styled.div`
  padding: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 1rem;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const FilterLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${COLORS.textSecondary};
  font-weight: 600;

  svg {
    color: ${COLORS.primaryBlueGray};
  }
`;

const FilterOptions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const FilterOption = styled.button`
  background-color: ${(props) =>
    props.active ? COLORS.primaryBlueGray : COLORS.elevatedBackground};
  color: ${(props) => (props.active ? "white" : COLORS.textSecondary)};
  border: 1px solid
    ${(props) => (props.active ? COLORS.primaryBlueGray : COLORS.border)};
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s;

  &:hover {
    background-color: ${(props) =>
      props.active ? COLORS.accentBlueGray : COLORS.buttonHover};
    border-color: ${(props) =>
      props.active ? COLORS.accentBlueGray : COLORS.primaryBlueGray};
  }
`;

const CustomDateRange = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const DateInput = styled.input`
  padding: 0.5rem;
  border: 1px solid ${COLORS.border};
  border-radius: 4px;
  color: ${COLORS.textPrimary};
  font-size: 0.875rem;
  background-color: ${COLORS.elevatedBackground};

  &:focus {
    outline: none;
    border-color: ${COLORS.primaryBlueGray};
  }
`;

const FilterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  gap: 1rem;
  border-top: 1px solid ${COLORS.border};
  background-color: ${COLORS.elevatedBackground};

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const ResetButton = styled.button`
  background: none;
  border: 1px solid ${COLORS.border};
  color: ${COLORS.textSecondary};
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.3s;

  &:hover {
    background-color: ${COLORS.buttonHover};
    color: ${COLORS.textPrimary};
  }
`;

const ApplyButton = styled.button`
  background-color: ${COLORS.primarySalmon};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${COLORS.accentSalmon};
  }
`;

const GalleryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1.5rem;

  @media (max-width: 767px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
`;

const GalleryItem = styled(motion.div)`
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px ${COLORS.shadow};
  position: relative;
  aspect-ratio: ${(props) => props.aspectRatio || "1 / 1"};
  cursor: pointer;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 8px;
    box-shadow: 0 0 0 0 ${COLORS.primarySalmon}50;
    opacity: 0;
    transition: all 0.3s ease;
    z-index: 1;
  }

  &:hover:before {
    box-shadow: 0 0 0 4px ${COLORS.primarySalmon}50;
    opacity: 1;
  }

  &:hover .item-overlay {
    opacity: 1;
  }
`;

const GalleryImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
`;

const VideoThumbnail = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;

  &:after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2));
    pointer-events: none;
  }
`;

const VideoPreview = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
`;

const VideoIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;

  svg {
    color: white;
    font-size: 1.125rem;
  }

  ${GalleryItem}:hover & {
    transform: translate(-50%, -50%) scale(1.1);
  }
`;

const ItemOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 1rem;
  opacity: 0;
  transition: opacity 0.3s;
`;

const OverlayInfo = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  color: white;
`;

const AssetDate = styled.div`
  font-size: 0.75rem;
  font-weight: 500;
`;

const AssetSize = styled.div`
  font-size: 0.75rem;
  opacity: 0.8;
`;

const AssetModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
  overflow-y: auto;

  @media (max-width: 768px) {
    padding: 1rem;
    align-items: flex-start;
    padding-bottom: 80px;
  }
`;

const ModalContent = styled.div`
  background-color: ${COLORS.cardBackground};
  border-radius: 8px;
  overflow: hidden;
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    max-height: 100%;
    border-radius: 0;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid ${COLORS.border};
  background-color: ${COLORS.elevatedBackground};
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  color: ${COLORS.textPrimary};
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: 1.5rem;
  gap: 1.5rem;
  flex: 1;

  @media (min-width: 768px) {
    flex-direction: row;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 1rem;
  }
`;

const AssetPreview = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background-color: ${COLORS.elevatedBackground};
  border-radius: 4px;
  overflow: hidden;
`;

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
`;

const PreviewVideo = styled.video`
  max-width: 100%;
  max-height: 500px;
`;

const AssetInfo = styled.div`
  flex: 0 0 300px;
  background-color: ${COLORS.elevatedBackground};
  border-radius: 4px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  height: fit-content;

  @media (max-width: 768px) {
    flex: 1;
    padding: 1rem;
  }
`;

const InfoGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  &:not(:last-child) {
    border-bottom: 1px solid ${COLORS.border};
    padding-bottom: 1rem;
  }

  .url {
    word-break: break-all;
  }
`;

const InfoLabel = styled.div`
  font-size: 0.75rem;
  color: ${COLORS.textTertiary};
  font-weight: 600;
`;

const InfoValue = styled.div`
  font-size: 0.875rem;
  color: ${COLORS.textPrimary};
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid ${COLORS.border};
  background-color: ${COLORS.elevatedBackground};

  @media (max-width: 768px) {
    padding: 1rem;
    flex-direction: row;
    justify-content: space-between;
    gap: 0.5rem;
    padding-bottom: calc(
      1rem + env(safe-area-inset-bottom, 0)
    ); // Add safe area for iOS devices
  }
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${(props) => props.color || COLORS.primaryBlueGray};
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    flex: 1;
    justify-content: center;
    font-size: 0.75rem;
    padding: 0.5rem;

    @media (max-width: 360px) {
      span {
        display: none;
      }
    }
  }
`;

const LoadingContainer = styled.div`
  margin: 2rem 0;
`;

const LoadingMoreContainer = styled.div`
  margin: 1rem 0;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 2rem;
  color: ${COLORS.error};
  background-color: ${COLORS.elevatedBackground};
  border-radius: 8px;
  margin: 2rem 0;
`;

const NoAssetsMessage = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${COLORS.textSecondary};
  background-color: ${COLORS.elevatedBackground};
  border-radius: 8px;
  margin: 1rem 0;
`;

const DateSection = styled.div`
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  position: relative;

  &:first-of-type {
    margin-top: 0;
  }
`;

const DateHeading = styled.h2`
  font-size: 1.25rem;
  color: ${COLORS.textPrimary};
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;

  &:after {
    content: "";
    flex: 1;
    height: 1px;
    background: ${COLORS.border};
    margin-left: 1rem;
  }

  @media (max-width: 767px) {
    font-size: 1.125rem;
  }
`;

const DateCount = styled.span`
  background-color: ${COLORS.primaryBlueGray};
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  margin-left: 0.75rem;
`;

const BulkActionBar = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: ${COLORS.primaryBlueGray};
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s ease;
  transform: translateY(${(props) => (props.visible ? "0" : "100%")});

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }
`;

const BulkInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-between;
  }
`;

const SelectedCount = styled.div`
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  span {
    background: rgba(255, 255, 255, 0.2);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
`;

const SelectionActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const SelectionAction = styled.button`
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const BulkActions = styled.div`
  display: flex;
  gap: 0.75rem;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: space-around;
  }
`;

const BulkActionButton = styled.button`
  background-color: ${(props) =>
    props.danger ? COLORS.error : COLORS.primarySalmon};
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }

  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    transform: none;
  }
`;

// Add selection UI to the GalleryItem
const SelectionOverlay = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 5;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  padding: 0.25rem;
  opacity: ${(props) => (props.visible ? 1 : 0)};
  transition: opacity 0.2s;
  cursor: pointer;

  ${GalleryItem}:hover & {
    opacity: 1;
  }

  svg {
    color: white;
    font-size: 1.25rem;
  }
`;

const SelectModeButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${(props) =>
    props.active ? COLORS.primarySalmon : COLORS.elevatedBackground};
  color: ${(props) => (props.active ? "white" : COLORS.textSecondary)};
  border: 1px solid
    ${(props) => (props.active ? COLORS.primarySalmon : COLORS.border)};
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: ${(props) =>
      props.active ? COLORS.accentSalmon : COLORS.buttonHover};
  }
`;

export default CloudinaryGallery;
