import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaArrowLeft,
  FaBell,
  FaDesktop,
  FaMobile,
  FaEnvelope,
  FaInfoCircle,
  FaChartBar,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaGlobe,
  FaEye,
  FaHandPointUp,
  FaExclamationTriangle,
  FaSpinner,
  FaRegClock,
  FaImage,
  FaFilter,
  FaHashtag,
  FaSave,
  FaHistory,
  FaNewspaper,
  FaPlus,
  FaTrash,
  FaEdit,
  FaFileDownload,
  FaCheckCircle,
  FaSyncAlt,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import { format, parseISO, isValid, subDays, addDays } from "date-fns";
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { ErrorBoundary } from "react-error-boundary";

// Generate demo data for charts (in a real app, this would come from the API)
const generateDemoData = () => {
  // Platform distribution
  const platformData = [
    { name: "Chrome", value: 45 },
    { name: "Firefox", value: 20 },
    { name: "Safari", value: 15 },
    { name: "Edge", value: 10 },
    { name: "Android", value: 8 },
    { name: "iOS", value: 2 },
  ];

  // Open rate data by time
  const today = new Date();
  const openRateData = Array(7)
    .fill()
    .map((_, i) => {
      const date = subDays(today, 6 - i);
      return {
        date: format(date, "MMM dd"),
        rate: 30 + Math.floor(Math.random() * 40),
      };
    });

  // Notification delivery data by time
  const timeData = [];
  for (let i = 0; i < 24; i++) {
    timeData.push({
      hour: i,
      sent: Math.floor(Math.random() * 50) + 10,
      opened: Math.floor(Math.random() * 30) + 5,
    });
  }

  // Subscriber growth
  const growthData = [];
  for (let i = 0; i < 30; i++) {
    const date = subDays(today, 29 - i);
    growthData.push({
      date: format(date, "MMM dd"),
      subscribers: 500 + Math.floor(i * 10 + Math.random() * 20),
    });
  }

  return { platformData, openRateData, timeData, growthData };
};

// Error Fallback component
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <ErrorContainer>
    <FaExclamationTriangle />
    <ErrorMessage>Something went wrong!</ErrorMessage>
    <p>{error.message}</p>
    <RetryButton onClick={resetErrorBoundary}>Try Again</RetryButton>
  </ErrorContainer>
);

// Main SubscriberAdmin component
const SubscriberAdmin = () => {
  const demoData = useRef(generateDemoData());
  const { isAuthenticated, user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";
  const fileInputRef = useRef(null);

  // State for subscriber and notification stats
  const [subscriberStats, setSubscriberStats] = useState({
    totalSubscribers: 0,
    lastSent: null,
    totalNotifications: 0,
    openRate: 0,
    activeSubscribers: 0,
    recentGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionType, setActionType] = useState(null);

  // State for notification creation form
  const [notificationTitle, setNotificationTitle] = useState("SoloGram Update");
  const [customMessage, setCustomMessage] = useState("");
  const [notificationImage, setNotificationImage] = useState(null);
  const [notificationUrl, setNotificationUrl] = useState("");
  const [notificationIcon, setNotificationIcon] = useState("default");
  const [scheduledTime, setScheduledTime] = useState("");
  const [targetAudience, setTargetAudience] = useState("all");
  const [targetTags, setTargetTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([
    "new_users",
    "active_users",
    "inactive_users",
    "premium_users",
  ]);

  const [platformDistribution, setPlatformDistribution] = useState([]);

  // State for notification preview and sending
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");

  // State for templates and notification history
  const [activeTab, setActiveTab] = useState("create");
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [notificationHistory, setNotificationHistory] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // State for filtering notification history
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Improved date formatter with robust error handling
  const formatDate = useCallback((dateString) => {
    if (!dateString) return null;

    try {
      let parsedDate;

      // First try to parse as ISO string
      parsedDate = parseISO(String(dateString));

      // If that fails, check if it's a Unix timestamp (in seconds)
      if (!isValid(parsedDate)) {
        // If it's a number or numeric string with 10 digits, assume it's a Unix timestamp in seconds
        if (/^\d{10}$/.test(String(dateString).trim())) {
          parsedDate = new Date(parseInt(dateString) * 1000);
        } else {
          // Try as a regular Date object
          parsedDate = new Date(dateString);
        }

        // If still invalid, return null
        if (!isValid(parsedDate)) {
          console.warn("Invalid date encountered:", dateString);
          return null;
        }
      }

      return format(parsedDate, "MMM dd, yyyy 'at' h:mm a");
    } catch (error) {
      console.warn("Error formatting date:", dateString, error);
      return null;
    }
  }, []);

  // Safe display helper function
  const safeDisplay = useCallback((content, fallback = "N/A") => {
    return content || fallback;
  }, []);

  // Axios with retry
  const axiosWithRetry = useCallback(
    async (method, url, data = null, maxRetries = 3) => {
      let retries = 0;

      while (retries < maxRetries) {
        try {
          if (method.toLowerCase() === "get") {
            return await axios.get(url);
          } else if (method.toLowerCase() === "post") {
            return await axios.post(url, data);
          } else if (method.toLowerCase() === "patch") {
            return await axios.patch(url, data);
          } else if (method.toLowerCase() === "delete") {
            return await axios.delete(url);
          }
        } catch (error) {
          retries++;
          if (retries >= maxRetries) {
            throw error;
          }

          // Exponential backoff with jitter
          const delay = Math.min(
            1000 * 2 ** retries + Math.random() * 1000,
            10000
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    },
    []
  );

  const fetchOneSignalPlatformData = useCallback(async () => {
    try {
      // Make API call to your backend endpoint that connects to OneSignal
      const response = await axiosWithRetry(
        "get",
        "/api/subscribers/platform-stats"
      );

      if (response.data.success) {
        // Transform the data for the pie chart
        const formattedData = Object.entries(response.data.data).map(
          ([name, value]) => ({
            name: name,
            value: parseInt(value, 10) || 0,
          })
        );

        // Sort by highest value first
        formattedData.sort((a, b) => b.value - a.value);

        setPlatformDistribution(formattedData);
      }
    } catch (err) {
      console.error("Error fetching OneSignal platform data:", err);
      // Fallback to demo data if API fails
      setPlatformDistribution(demoData.current.platformData);
    }
  }, [axiosWithRetry]);

  // Fetch notification data with improved error handling
  const fetchNotificationData = useCallback(
    async (showToast = false) => {
      if (!isAuthenticated || !isAdmin) {
        return;
      }

      try {
        setLoading(true);

        const [statsResponse, templatesResponse, historyResponse] =
          await Promise.all([
            axiosWithRetry("get", "/api/subscribers/stats"),
            axiosWithRetry("get", "/api/subscribers/templates"),
            axiosWithRetry("get", "/api/subscribers/notifications"),
          ]);
        console.log("statsResponse", statsResponse.data);
        const {
          totalSubscribers = 0,
          lastSent = null,
          totalNotifications = 0,
          openRate = 0,
          activeSubscribers = 0,
          recentGrowth = 0,
        } = statsResponse.data || {};

        setSubscriberStats({
          totalSubscribers,
          lastSent,
          totalNotifications,
          openRate,
          activeSubscribers,
          recentGrowth,
        });
        // Also fetch platform distribution data
        await fetchOneSignalPlatformData();

        setError(null);

        if (showToast) {
          toast.success("Data refreshed successfully");
        }
      } catch (err) {
        console.error("Error fetching notification data:", err);
        setError("Failed to load notification data. Please try again.");
        toast.error("Failed to load notification data");
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, isAdmin, axiosWithRetry, fetchOneSignalPlatformData] // Add fetchOneSignalPlatformData to dependencies
  );

  // Initial data load
  useEffect(() => {
    fetchNotificationData();
  }, [fetchNotificationData]);

  // Form validation
  const isFormValid = useMemo(() => {
    return (
      notificationTitle.trim() &&
      customMessage.trim() &&
      (!saveAsTemplate || (saveAsTemplate && templateName.trim()))
    );
  }, [notificationTitle, customMessage, saveAsTemplate, templateName]);

  // Handle file upload
  const handleFileSelect = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setNotificationImage(file);
      toast.success(`Image "${file.name}" selected`);
    }
  }, []);

  // Show send confirmation
  const handleSendCustomNotification = useCallback(
    (e) => {
      e.preventDefault();

      if (!isFormValid) {
        toast.error("Please fill all required fields");
        return;
      }

      setShowSendModal(true);
    },
    [isFormValid]
  );

  // Send notification with improved error handling
  const confirmSendNotification = useCallback(async () => {
    try {
      setSendingMessage(true);
      setShowSendModal(false);

      // Prepare notification data for sending
      const notificationData = {
        title: notificationTitle,
        message: customMessage,
        url: notificationUrl,
        icon: notificationIcon,
        scheduledFor: scheduledTime || null,
        audience: targetAudience,
        tags: targetTags.length > 0 ? targetTags : null,
      };

      // Send notification
      const response = await axiosWithRetry(
        "post",
        "/api/subscribers/custom",
        notificationData
      );

      if (response.data.success) {
        // Save as template if selected
        if (saveAsTemplate && templateName) {
          await axiosWithRetry("post", "/api/subscribers/templates", {
            name: templateName,
            title: notificationTitle,
            message: customMessage,
            url: notificationUrl,
            icon: notificationIcon,
          });
        }

        // Show success message
        if (scheduledTime) {
          toast.success(
            `Message scheduled to be sent to ${
              targetAudience === "all"
                ? "all subscribers"
                : "targeted subscribers"
            }`
          );
        } else {
          toast.success(
            `Message sent to ${response.data.notified} subscribers`
          );
        }

        // Reset form
        resetForm();

        // Refresh notification data
        fetchNotificationData();
      } else {
        toast.error(response.data.message || "Failed to send notification");
      }
    } catch (err) {
      console.error("Error sending notification:", err);
      toast.error("Failed to send notification");
    } finally {
      setSendingMessage(false);
    }
  }, [
    notificationTitle,
    customMessage,
    notificationUrl,
    notificationIcon,
    scheduledTime,
    targetAudience,
    targetTags,
    saveAsTemplate,
    templateName,
    axiosWithRetry,
    fetchNotificationData,
  ]);

  // Load template with error handling
  const loadTemplate = useCallback((template) => {
    try {
      setNotificationTitle(template.title || "");
      setCustomMessage(template.message || "");
      setNotificationUrl(template.url || "");
      setNotificationIcon(template.icon || "default");
      setSelectedTemplate(template.id);
      setActiveTab("create");
      toast.success(`Template "${template.name}" loaded`);
    } catch (error) {
      console.error("Error loading template:", error);
      toast.error("Failed to load template");
    }
  }, []);

  // Delete template with confirmation
  const deleteTemplate = useCallback(
    async (templateId, templateName) => {
      if (
        !window.confirm(
          `Are you sure you want to delete template "${templateName}"?`
        )
      ) {
        return;
      }

      try {
        setActionLoading(true);
        setActionType(`delete-template-${templateId}`);

        const response = await axiosWithRetry(
          "delete",
          `/api/subscribers/templates/${templateId}`
        );

        if (response.data.success) {
          toast.success("Template deleted");

          // If currently selected template is deleted, reset form
          if (selectedTemplate === templateId) {
            resetForm();
          }

          // Refresh notification data
          fetchNotificationData();
        } else {
          toast.error(response.data.message || "Failed to delete template");
        }
      } catch (err) {
        console.error("Error deleting template:", err);
        toast.error("Failed to delete template");
      } finally {
        setActionLoading(false);
        setActionType(null);
      }
    },
    [selectedTemplate, axiosWithRetry, fetchNotificationData]
  );

  // Cancel scheduled notification
  const cancelScheduledNotification = useCallback(
    async (notificationId) => {
      try {
        setActionLoading(true);
        setActionType(`cancel-notification-${notificationId}`);

        const response = await axiosWithRetry(
          "patch",
          `/api/subscribers/notifications/${notificationId}/cancel`
        );

        if (response.data.success) {
          toast.success("Scheduled notification cancelled");
          // Refresh notification data
          fetchNotificationData();
        } else {
          toast.error(response.data.message || "Failed to cancel notification");
        }
      } catch (err) {
        console.error("Error cancelling notification:", err);
        toast.error("Failed to cancel notification");
      } finally {
        setActionLoading(false);
        setActionType(null);
      }
    },
    [axiosWithRetry, fetchNotificationData]
  );

  // Reset form fields
  const resetForm = useCallback(() => {
    setNotificationTitle("SoloGram Update");
    setCustomMessage("");
    setNotificationImage(null);
    setNotificationUrl("");
    setNotificationIcon("default");
    setScheduledTime("");
    setTargetAudience("all");
    setTargetTags([]);
    setSelectedTemplate(null);
    setSaveAsTemplate(false);
    setTemplateName("");
  }, []);

  // Toggle tag selection
  const handleTagToggle = useCallback((tag) => {
    setTargetTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag]
    );
  }, []);

  // Export notification data
  const exportNotificationData = useCallback(() => {
    try {
      // In a real app, this would generate and download a CSV or Excel file
      const csvData = [
        ["Title", "Date", "Status", "Audience", "Sent", "Opened", "Open Rate"],
        ...notificationHistory.map((notification) => [
          notification.title,
          notification.sentAt
            ? formatDate(notification.sentAt)
            : notification.scheduledFor
            ? `Scheduled for ${formatDate(notification.scheduledFor)}`
            : "Not sent",
          notification.status,
          notification.audience,
          notification.sent || 0,
          notification.opened || 0,
          `${notification.openRate || 0}%`,
        ]),
      ];

      // Convert to CSV
      const csvContent = csvData.map((row) => row.join(",")).join("\n");

      // Create blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `notification_data_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Notification data exported successfully");
    } catch (error) {
      console.error("Error exporting notification data:", error);
      toast.error("Failed to export notification data");
    }
  }, [notificationHistory, formatDate]);

  // Memoized filtered history
  const getFilteredHistory = useMemo(() => {
    const filtered = notificationHistory.filter((notification) => {
      // Filter by status
      if (filterStatus !== "all" && notification.status !== filterStatus) {
        return false;
      }

      // Filter by date range
      if (filterStartDate && filterEndDate) {
        const notifDate = notification.sentAt || notification.scheduledFor;
        if (!notifDate) return true; // Include notifications without dates

        try {
          const date = parseISO(notifDate);
          const start = parseISO(filterStartDate);
          const end = addDays(parseISO(filterEndDate), 1); // Include the full end day

          if (!isValid(date) || !isValid(start) || !isValid(end)) {
            console.warn("Invalid date in filter", {
              notifDate,
              filterStartDate,
              filterEndDate,
            });
            return true; // Include if date parsing fails
          }

          return date >= start && date < end;
        } catch (error) {
          console.error("Date filtering error:", error);
          return true; // Include in case of error
        }
      }

      return true;
    });

    return filtered;
  }, [notificationHistory, filterStatus, filterStartDate, filterEndDate]);

  // Calculate paginated data
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return getFilteredHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [getFilteredHistory, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(getFilteredHistory.length / itemsPerPage);
  }, [getFilteredHistory, itemsPerPage]);

  // Page change handler
  const handlePageChange = useCallback((pageNumber) => {
    setCurrentPage(pageNumber);
  }, []);

  // Prepare chart colors
  const CHART_COLORS = [
    "#FF7E5F",
    "#FEB47B",
    "#7BE0AD",
    "#00B2FF",
    "#A06EFF",
    "#FF61A6",
  ];

  // Access denied view
  if (!isAuthenticated || !isAdmin) {
    return (
      <PageWrapper>
        <Container>
          <AccessDenied>
            <FaBell />
            <h2>Access Denied</h2>
            <p>You must be an admin to view this page.</p>
            <BackLink to="/">Return to Home</BackLink>
          </AccessDenied>
        </Container>
      </PageWrapper>
    );
  }

  // Loading view
  if (loading) {
    return (
      <PageWrapper>
        <Container>
          <LoadingContainer>
            <LoadingSpinner />
            <LoadingMessage>Loading notification dashboard...</LoadingMessage>
          </LoadingContainer>
        </Container>
      </PageWrapper>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <PageWrapper>
        <Container>
          <Header>
            <HeaderLeft>
              <BackLink to="/admin">
                <FaArrowLeft />
                <span>Back to Admin</span>
              </BackLink>

              <PageTitle>
                <FaBell />
                <span>Push Notification Dashboard</span>
              </PageTitle>
            </HeaderLeft>

            <HeaderRight>
              <RefreshButton
                onClick={() => fetchNotificationData(true)}
                disabled={loading}
                title="Refresh data"
              >
                <FaSyncAlt className={loading ? "spinning" : ""} />
              </RefreshButton>
              <ExportButton
                onClick={exportNotificationData}
                disabled={loading || notificationHistory.length === 0}
              >
                <FaFileDownload />
                <span>Export Data</span>
              </ExportButton>
            </HeaderRight>
          </Header>

          {error ? (
            <ErrorContainer>
              <FaExclamationTriangle />
              <ErrorMessage>{error}</ErrorMessage>
              <RetryButton onClick={() => fetchNotificationData()}>
                Try Again
              </RetryButton>
            </ErrorContainer>
          ) : (
            <>
              <StatsContainer>
                <StatCard highlight>
                  <StatIcon className="subscribers">
                    <FaUsers />
                  </StatIcon>
                  <StatInfo>
                    <StatValue>
                      {typeof subscriberStats.totalSubscribers === "number"
                        ? subscriberStats.totalSubscribers.toLocaleString()
                        : "0"}
                    </StatValue>
                    <StatLabel>Total Subscribers</StatLabel>
                    <StatTrend positive={subscriberStats.recentGrowth > 0}>
                      {subscriberStats.recentGrowth > 0 ? "+" : ""}
                      {subscriberStats.recentGrowth}% this month
                    </StatTrend>
                  </StatInfo>
                </StatCard>

                <StatCard>
                  <StatIcon className="active">
                    <FaHandPointUp />
                  </StatIcon>
                  <StatInfo>
                    <StatValue>
                      {subscriberStats.activeSubscribers.toLocaleString()}
                    </StatValue>
                    <StatLabel>Active Subscribers</StatLabel>
                    <StatTrend positive={true}>
                      {Math.round(
                        (subscriberStats.activeSubscribers /
                          Math.max(subscriberStats.totalSubscribers, 1)) *
                          100
                      )}
                      % of total
                    </StatTrend>
                  </StatInfo>
                </StatCard>

                <StatCard>
                  <StatIcon className="notifications">
                    <FaBell />
                  </StatIcon>
                  <StatInfo>
                    <StatValue>{subscriberStats.totalNotifications}</StatValue>
                    <StatLabel>Total Notifications</StatLabel>
                    <StatTrend>Last 30 days</StatTrend>
                  </StatInfo>
                </StatCard>

                <StatCard>
                  <StatIcon className="openrate">
                    <FaEye />
                  </StatIcon>
                  <StatInfo>
                    <StatValue>{subscriberStats.openRate}%</StatValue>
                    <StatLabel>Average Open Rate</StatLabel>
                    <StatTrend>Last 30 days</StatTrend>
                  </StatInfo>
                </StatCard>

                <StatCard>
                  <StatIcon className="last">
                    <FaRegClock />
                  </StatIcon>
                  <StatInfo>
                    <StatValue>
                      {safeDisplay(
                        subscriberStats.lastSent
                          ? formatDate(subscriberStats.lastSent)?.split(
                              " at "
                            )?.[0]
                          : null,
                        "Never"
                      )}
                    </StatValue>
                    <StatLabel>Last Notification</StatLabel>
                    {subscriberStats.lastSent &&
                      formatDate(subscriberStats.lastSent) && (
                        <StatTrend>
                          at{" "}
                          {formatDate(subscriberStats.lastSent).split(
                            " at "
                          )[1] || ""}
                        </StatTrend>
                      )}
                  </StatInfo>
                </StatCard>
              </StatsContainer>

              <TabsContainer>
                <TabButton
                  active={activeTab === "create"}
                  onClick={() => setActiveTab("create")}
                >
                  <FaBell />
                  <span>Create Notification</span>
                </TabButton>
                <TabButton
                  active={activeTab === "templates"}
                  onClick={() => setActiveTab("templates")}
                >
                  <FaSave />
                  <span>Templates</span>
                  <TabBadge>{notificationTemplates.length}</TabBadge>
                </TabButton>
                <TabButton
                  active={activeTab === "history"}
                  onClick={() => setActiveTab("history")}
                >
                  <FaHistory />
                  <span>Notification History</span>
                  <TabBadge>{notificationHistory.length}</TabBadge>
                </TabButton>
                <TabButton
                  active={activeTab === "analytics"}
                  onClick={() => setActiveTab("analytics")}
                >
                  <FaChartBar />
                  <span>Analytics</span>
                </TabButton>
              </TabsContainer>

              {activeTab === "create" && (
                <ContentSection>
                  <SectionTitle>Send Push Notification</SectionTitle>
                  <NotificationForm onSubmit={handleSendCustomNotification}>
                    <FormRow>
                      <FormGroup>
                        <Label htmlFor="notificationTitle">
                          Notification Title
                        </Label>
                        <NotificationTitleInput
                          id="notificationTitle"
                          type="text"
                          placeholder="Enter notification title..."
                          value={notificationTitle}
                          onChange={(e) => setNotificationTitle(e.target.value)}
                          disabled={sendingMessage}
                          required
                          maxLength={100}
                        />
                        <CharacterCount
                          className={
                            notificationTitle.length > 80 ? "warning" : ""
                          }
                        >
                          {notificationTitle.length}/100
                        </CharacterCount>
                      </FormGroup>

                      <FormGroup>
                        <Label htmlFor="notificationIcon">
                          Notification Icon
                        </Label>
                        <Select
                          id="notificationIcon"
                          value={notificationIcon}
                          onChange={(e) => setNotificationIcon(e.target.value)}
                          disabled={sendingMessage}
                        >
                          <option value="default">Default App Icon</option>
                          <option value="announcement">
                            Announcement Icon
                          </option>
                          <option value="content">Content Icon</option>
                          <option value="trending">Trending Icon</option>
                          <option value="alert">Alert Icon</option>
                        </Select>
                      </FormGroup>
                    </FormRow>

                    <FormGroup>
                      <Label htmlFor="notificationMessage">
                        Notification Message
                      </Label>
                      <NotificationInput
                        id="notificationMessage"
                        placeholder="Enter message to send to subscribers..."
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        disabled={sendingMessage}
                        required
                        maxLength={1000}
                      />
                      <CharacterCount
                        className={customMessage.length > 500 ? "warning" : ""}
                      >
                        {customMessage.length}/1000 characters
                        {customMessage.length > 500 &&
                          " (very long messages may be truncated on some devices)"}
                      </CharacterCount>
                    </FormGroup>

                    <FormRow>
                      <FormGroup>
                        <Label htmlFor="notificationUrl">
                          Destination URL (optional)
                        </Label>
                        <NotificationTitleInput
                          id="notificationUrl"
                          type="url"
                          placeholder="e.g., /explore or https://yourdomain.com/page"
                          value={notificationUrl}
                          onChange={(e) => setNotificationUrl(e.target.value)}
                          disabled={sendingMessage}
                          pattern="(^\/[a-zA-Z0-9\-_\/]*$)|(^https?:\/\/[a-zA-Z0-9\-_\.\/\:]+$)"
                          title="Enter a valid URL starting with / or https://"
                        />
                        <FieldHint>
                          Where users will be taken when they click the
                          notification
                        </FieldHint>
                      </FormGroup>

                      <FormGroup>
                        <Label htmlFor="notificationImage">
                          Image (optional)
                        </Label>
                        <FileInputContainer>
                          <HiddenFileInput
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            disabled={sendingMessage}
                          />
                          <FileInputButton
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            disabled={sendingMessage}
                          >
                            <FaImage />
                            <span>Select Image</span>
                          </FileInputButton>
                          <FileNameDisplay>
                            {notificationImage
                              ? notificationImage.name
                              : "No image selected"}
                          </FileNameDisplay>
                        </FileInputContainer>
                        <FieldHint>
                          Recommended size: 1200×600px, max 5MB. Large images
                          may not display on all devices.
                        </FieldHint>
                      </FormGroup>
                    </FormRow>

                    <FormSectionDivider>
                      <FaUsers />
                      <span>Target Audience</span>
                    </FormSectionDivider>

                    <FormRow>
                      <FormGroup>
                        <Label>Audience Selection</Label>
                        <Select
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          disabled={sendingMessage}
                        >
                          <option value="all">All Subscribers</option>
                          <option value="segments">User Segments</option>
                          <option value="tags">By Tags</option>
                        </Select>
                      </FormGroup>

                      {targetAudience === "tags" && (
                        <FormGroup>
                          <Label>Select Tags</Label>
                          <TagsContainer>
                            {availableTags.map((tag) => (
                              <TagButton
                                key={tag}
                                selected={targetTags.includes(tag)}
                                onClick={() => handleTagToggle(tag)}
                                type="button"
                                disabled={sendingMessage}
                              >
                                <FaHashtag />
                                <span>{tag.replace("_", " ")}</span>
                              </TagButton>
                            ))}
                          </TagsContainer>
                          {targetAudience === "tags" &&
                            targetTags.length === 0 && (
                              <FieldError>
                                Please select at least one tag
                              </FieldError>
                            )}
                        </FormGroup>
                      )}
                    </FormRow>

                    <FormSectionDivider>
                      <FaClock />
                      <span>Timing</span>
                    </FormSectionDivider>

                    <FormRow>
                      <FormGroup>
                        <Label htmlFor="scheduledTime">
                          Schedule for Later (optional)
                        </Label>
                        <DateTimeInput
                          id="scheduledTime"
                          type="datetime-local"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                          disabled={sendingMessage}
                        />
                        <FieldHint>
                          Leave empty to send immediately. Scheduled
                          notifications can be cancelled before sending.
                        </FieldHint>
                      </FormGroup>
                    </FormRow>

                    <FormSectionDivider>
                      <FaSave />
                      <span>Save as Template</span>
                    </FormSectionDivider>

                    <FormRow>
                      <CheckboxGroup>
                        <CheckboxWrapper>
                          <Checkbox
                            id="saveTemplate"
                            type="checkbox"
                            checked={saveAsTemplate}
                            onChange={() => setSaveAsTemplate(!saveAsTemplate)}
                            disabled={sendingMessage}
                          />
                          <CheckboxLabel htmlFor="saveTemplate">
                            Save this notification as a template
                          </CheckboxLabel>
                        </CheckboxWrapper>
                      </CheckboxGroup>

                      {saveAsTemplate && (
                        <FormGroup>
                          <Label htmlFor="templateName">Template Name</Label>
                          <NotificationTitleInput
                            id="templateName"
                            type="text"
                            placeholder="Enter template name..."
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            disabled={sendingMessage}
                            required={saveAsTemplate}
                            maxLength={50}
                          />
                          {saveAsTemplate && !templateName && (
                            <FieldError>
                              Please enter a template name
                            </FieldError>
                          )}
                        </FormGroup>
                      )}
                    </FormRow>

                    <InfoPanel>
                      <FaInfoCircle />
                      <InfoContent>
                        This notification will be sent to
                        {targetAudience === "all"
                          ? " all users "
                          : targetAudience === "tags"
                          ? ` users with ${
                              targetTags.length === 0 ? "no" : "selected"
                            } tags `
                          : " users in selected segments "}
                        who have subscribed to push notifications.
                        {scheduledTime
                          ? ` It will be sent at ${
                              formatDate(scheduledTime) || "the scheduled time"
                            }.`
                          : " It will be sent immediately."}
                      </InfoContent>
                    </InfoPanel>

                    <ButtonRow>
                      <ResetButton
                        type="button"
                        onClick={resetForm}
                        disabled={sendingMessage}
                      >
                        Reset Form
                      </ResetButton>

                      <SendButton
                        type="submit"
                        disabled={
                          sendingMessage ||
                          !customMessage.trim() ||
                          !notificationTitle.trim() ||
                          (saveAsTemplate && !templateName.trim()) ||
                          (targetAudience === "tags" && targetTags.length === 0)
                        }
                      >
                        {sendingMessage ? (
                          <>
                            <FaSpinner className="spinning" />
                            <span>Sending...</span>
                          </>
                        ) : scheduledTime ? (
                          <>
                            <FaClock />
                            <span>Schedule Notification</span>
                          </>
                        ) : (
                          <>
                            <FaEnvelope />
                            <span>Send Notification</span>
                          </>
                        )}
                      </SendButton>
                    </ButtonRow>
                  </NotificationForm>

                  {selectedTemplate && (
                    <TemplateAlert>
                      <FaInfoCircle />
                      <span>
                        You're editing the "
                        {safeDisplay(
                          notificationTemplates.find(
                            (t) => t.id === selectedTemplate
                          )?.name
                        )}
                        " template. Changes won't be saved to the template
                        unless you save it as a new template.
                      </span>
                      <CloseButton onClick={() => setSelectedTemplate(null)}>
                        ×
                      </CloseButton>
                    </TemplateAlert>
                  )}
                </ContentSection>
              )}

              {activeTab === "templates" && (
                <ContentSection>
                  <SectionTitle>Notification Templates</SectionTitle>

                  {notificationTemplates.length === 0 ? (
                    <EmptyState>
                      <FaSave />
                      <h3>No Templates Yet</h3>
                      <p>
                        Save your notifications as templates to quickly send
                        them again in the future. You can create a template by
                        selecting "Save as template" when sending a
                        notification.
                      </p>
                    </EmptyState>
                  ) : (
                    <TemplatesGrid>
                      {notificationTemplates.map((template) => (
                        <TemplateCard key={template.id}>
                          <TemplateHeader>
                            <TemplateTitle>
                              {safeDisplay(template.name)}
                            </TemplateTitle>
                            <TemplateActions>
                              <TemplateAction
                                title="Use template"
                                onClick={() => loadTemplate(template)}
                                disabled={
                                  actionLoading &&
                                  actionType ===
                                    `delete-template-${template.id}`
                                }
                              >
                                <FaEdit />
                              </TemplateAction>
                              <TemplateAction
                                title="Delete template"
                                onClick={() =>
                                  deleteTemplate(template.id, template.name)
                                }
                                className="delete"
                                disabled={
                                  actionLoading &&
                                  actionType ===
                                    `delete-template-${template.id}`
                                }
                              >
                                {actionLoading &&
                                actionType ===
                                  `delete-template-${template.id}` ? (
                                  <FaSpinner className="spinning" />
                                ) : (
                                  <FaTrash />
                                )}
                              </TemplateAction>
                            </TemplateActions>
                          </TemplateHeader>
                          <TemplatePreview>
                            <TemplatePreviewTitle>
                              {safeDisplay(template.title)}
                            </TemplatePreviewTitle>
                            <TemplatePreviewContent>
                              {safeDisplay(template.message)}
                            </TemplatePreviewContent>
                            {template.url && (
                              <TemplatePreviewURL>
                                <FaGlobe />
                                <span>{template.url}</span>
                              </TemplatePreviewURL>
                            )}
                          </TemplatePreview>
                        </TemplateCard>
                      ))}
                    </TemplatesGrid>
                  )}
                </ContentSection>
              )}

              {activeTab === "history" && (
                <ContentSection>
                  <HistoryHeader>
                    <SectionTitle>Notification History</SectionTitle>
                    <HistoryFilters>
                      <FilterGroup>
                        <Label>Date Range</Label>
                        <FilterRow>
                          <DateInput
                            type="date"
                            value={filterStartDate}
                            onChange={(e) => {
                              setFilterStartDate(e.target.value);
                              setCurrentPage(1); // Reset to first page on filter change
                            }}
                            placeholder="From"
                          />
                          <DateInput
                            type="date"
                            value={filterEndDate}
                            onChange={(e) => {
                              setFilterEndDate(e.target.value);
                              setCurrentPage(1); // Reset to first page on filter change
                            }}
                            placeholder="To"
                            min={filterStartDate}
                          />
                        </FilterRow>
                      </FilterGroup>
                      <FilterGroup>
                        <Label>Status</Label>
                        <Select
                          value={filterStatus}
                          onChange={(e) => {
                            setFilterStatus(e.target.value);
                            setCurrentPage(1); // Reset to first page on filter change
                          }}
                        >
                          <option value="all">All Status</option>
                          <option value="completed">Sent</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="cancelled">Cancelled</option>
                        </Select>
                      </FilterGroup>
                    </HistoryFilters>
                  </HistoryHeader>

                  {getFilteredHistory.length === 0 ? (
                    <EmptyState>
                      <FaHistory />
                      <h3>No Notifications Found</h3>
                      <p>
                        {filterStartDate ||
                        filterEndDate ||
                        filterStatus !== "all"
                          ? "No notifications match your current filters. Try adjusting your filter criteria."
                          : "You haven't sent any notifications yet. Create your first notification to see it here."}
                      </p>
                    </EmptyState>
                  ) : (
                    <>
                      <NotificationTable>
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Date</th>
                            <th>Audience</th>
                            <th>Status</th>
                            <th>Performance</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedHistory.map((notification) => (
                            <TableRow key={notification.id}>
                              <td>
                                <NotificationTitleCell>
                                  <span>{safeDisplay(notification.title)}</span>
                                  <NotificationMessage>
                                    {safeDisplay(notification.message)}
                                  </NotificationMessage>
                                </NotificationTitleCell>
                              </td>
                              <td>
                                {notification.sentAt
                                  ? safeDisplay(formatDate(notification.sentAt))
                                  : notification.scheduledFor
                                  ? `Scheduled for ${safeDisplay(
                                      formatDate(notification.scheduledFor)
                                    )}`
                                  : "Not sent yet"}
                              </td>
                              <td>
                                <AudienceTag>
                                  {notification.audience === "all"
                                    ? "All Users"
                                    : safeDisplay(
                                        notification.audience
                                      ).replace("_", " ")}
                                </AudienceTag>
                              </td>
                              <td>
                                <StatusBadge status={notification.status}>
                                  {notification.status === "completed" && (
                                    <FaCheckCircle />
                                  )}
                                  {notification.status === "scheduled" && (
                                    <FaRegClock />
                                  )}
                                  {notification.status === "cancelled" && (
                                    <FaExclamationTriangle />
                                  )}
                                  <span>
                                    {notification.status === "completed"
                                      ? "Sent"
                                      : notification.status === "scheduled"
                                      ? "Scheduled"
                                      : "Cancelled"}
                                  </span>
                                </StatusBadge>
                              </td>
                              <td>
                                {notification.status === "completed" ? (
                                  <PerformanceMetrics>
                                    <MetricItem>
                                      <span>Sent:</span>{" "}
                                      {notification.sent || 0}
                                    </MetricItem>
                                    <MetricItem>
                                      <span>Opened:</span>{" "}
                                      {notification.opened || 0}
                                    </MetricItem>
                                    <MetricItem
                                      className={
                                        notification.openRate >= 40
                                          ? "positive"
                                          : notification.openRate < 20
                                          ? "negative"
                                          : ""
                                      }
                                    >
                                      <span>Rate:</span>{" "}
                                      {notification.openRate || 0}%
                                    </MetricItem>
                                  </PerformanceMetrics>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td>
                                {notification.status === "scheduled" ? (
                                  <ActionButton
                                    className="cancel"
                                    onClick={() =>
                                      cancelScheduledNotification(
                                        notification.id
                                      )
                                    }
                                    disabled={
                                      actionLoading &&
                                      actionType ===
                                        `cancel-notification-${notification.id}`
                                    }
                                  >
                                    {actionLoading &&
                                    actionType ===
                                      `cancel-notification-${notification.id}` ? (
                                      <FaSpinner className="spinning" />
                                    ) : (
                                      "Cancel"
                                    )}
                                  </ActionButton>
                                ) : notification.status === "completed" ? (
                                  <ActionButton
                                    onClick={() => {
                                      loadTemplate({
                                        id: notification.id,
                                        name: notification.title,
                                        title: notification.title,
                                        message: notification.message,
                                        url: notification.url,
                                        icon: notification.icon,
                                      });
                                    }}
                                  >
                                    Resend
                                  </ActionButton>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </TableRow>
                          ))}
                        </tbody>
                      </NotificationTable>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <Pagination>
                          <PaginationButton
                            onClick={() => handlePageChange(1)}
                            disabled={currentPage === 1}
                          >
                            First
                          </PaginationButton>

                          <PaginationButton
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </PaginationButton>

                          <PaginationInfo>
                            Page {currentPage} of {totalPages}
                          </PaginationInfo>

                          <PaginationButton
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </PaginationButton>

                          <PaginationButton
                            onClick={() => handlePageChange(totalPages)}
                            disabled={currentPage === totalPages}
                          >
                            Last
                          </PaginationButton>

                          <PaginationSelect
                            value={itemsPerPage}
                            onChange={(e) => {
                              setItemsPerPage(Number(e.target.value));
                              setCurrentPage(1); // Reset to first page when changing items per page
                            }}
                          >
                            <option value={5}>5 per page</option>
                            <option value={10}>10 per page</option>
                            <option value={25}>25 per page</option>
                            <option value={50}>50 per page</option>
                          </PaginationSelect>
                        </Pagination>
                      )}
                    </>
                  )}
                </ContentSection>
              )}

              {activeTab === "analytics" && (
                <ContentSection>
                  <SectionTitle>Notification Analytics</SectionTitle>

                  <ChartGrid>
                    <ChartCard>
                      <ChartTitle>
                        <FaUsers />
                        <span>Subscriber Growth</span>
                      </ChartTitle>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={demoData.current.growthData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#333333"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: "#aaaaaa" }}
                            tickFormatter={(value) => value.split(" ")[0]}
                          />
                          <YAxis tick={{ fill: "#aaaaaa" }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#2a2a2a",
                              border: "none",
                              borderRadius: "4px",
                            }}
                            itemStyle={{ color: "#ffffff" }}
                            labelStyle={{
                              color: "#ffffff",
                              fontWeight: "bold",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="subscribers"
                            stroke="#FF7E5F"
                            strokeWidth={2}
                            name="Subscribers"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard>
                      <ChartTitle>
                        <FaEye />
                        <span>Open Rates</span>
                      </ChartTitle>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={demoData.current.openRateData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#333333"
                          />
                          <XAxis dataKey="date" tick={{ fill: "#aaaaaa" }} />
                          <YAxis tick={{ fill: "#aaaaaa" }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#2a2a2a",
                              border: "none",
                              borderRadius: "4px",
                            }}
                            itemStyle={{ color: "#ffffff" }}
                            labelStyle={{
                              color: "#ffffff",
                              fontWeight: "bold",
                            }}
                            formatter={(value) => [`${value}%`, "Open Rate"]}
                          />
                          <Bar
                            dataKey="rate"
                            fill="#00B2FF"
                            name="Open Rate"
                            unit="%"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard>
                      <ChartTitle>
                        <FaDesktop />
                        <span>Platform Distribution</span>
                      </ChartTitle>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={
                              platformDistribution.length > 0
                                ? platformDistribution
                                : demoData.current.platformData
                            }
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {(platformDistribution.length > 0
                              ? platformDistribution
                              : demoData.current.platformData
                            ).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#2a2a2a",
                              border: "none",
                              borderRadius: "4px",
                            }}
                            itemStyle={{ color: "#ffffff" }}
                            labelStyle={{
                              color: "#ffffff",
                              fontWeight: "bold",
                            }}
                            formatter={(value, name, props) => [
                              `${value} users`,
                              props.payload.name,
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartCard>

                    <ChartCard>
                      <ChartTitle>
                        <FaClock />
                        <span>Notification Activity by Hour</span>
                      </ChartTitle>
                      <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={demoData.current.timeData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#333333"
                          />
                          <XAxis
                            dataKey="hour"
                            tick={{ fill: "#aaaaaa" }}
                            tickFormatter={(hour) => `${hour}:00`}
                          />
                          <YAxis tick={{ fill: "#aaaaaa" }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#2a2a2a",
                              border: "none",
                              borderRadius: "4px",
                            }}
                            itemStyle={{ color: "#ffffff" }}
                            labelStyle={{
                              color: "#ffffff",
                              fontWeight: "bold",
                            }}
                            labelFormatter={(hour) =>
                              `${hour}:00 - ${hour + 1}:00`
                            }
                          />
                          <Legend wrapperStyle={{ color: "#aaaaaa" }} />
                          <Bar
                            dataKey="sent"
                            name="Notifications Sent"
                            fill="#FEB47B"
                          />
                          <Bar
                            dataKey="opened"
                            name="Notifications Opened"
                            fill="#7BE0AD"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartCard>
                  </ChartGrid>

                  <SectionTitle>Best Practices</SectionTitle>
                  <BestPracticesGrid>
                    <BestPracticeCard>
                      <BestPracticeIcon>
                        <FaClock />
                      </BestPracticeIcon>
                      <BestPracticeContent>
                        <h3>Optimal Timing</h3>
                        <p>
                          Based on your data, the best times to send
                          notifications are between 7-9 AM and 6-8 PM.
                        </p>
                      </BestPracticeContent>
                    </BestPracticeCard>

                    <BestPracticeCard>
                      <BestPracticeIcon>
                        <FaNewspaper />
                      </BestPracticeIcon>
                      <BestPracticeContent>
                        <h3>Content Strategy</h3>
                        <p>
                          Notifications about new content and features get 45%
                          higher open rates than promotional messages.
                        </p>
                      </BestPracticeContent>
                    </BestPracticeCard>

                    <BestPracticeCard>
                      <BestPracticeIcon>
                        <FaUsers />
                      </BestPracticeIcon>
                      <BestPracticeContent>
                        <h3>Audience Targeting</h3>
                        <p>
                          Targeted notifications to specific user segments
                          perform 68% better than general broadcasts.
                        </p>
                      </BestPracticeContent>
                    </BestPracticeCard>

                    <BestPracticeCard>
                      <BestPracticeIcon>
                        <FaImage />
                      </BestPracticeIcon>
                      <BestPracticeContent>
                        <h3>Rich Media</h3>
                        <p>
                          Notifications with images have a 23% higher engagement
                          rate compared to text-only messages.
                        </p>
                      </BestPracticeContent>
                    </BestPracticeCard>
                  </BestPracticesGrid>
                </ContentSection>
              )}

              <SectionTitle>About Push Notifications</SectionTitle>
              <InfoCard>
                <InfoCardHeader>
                  <FaInfoCircle />
                  <h3>Push Notification Service</h3>
                </InfoCardHeader>
                <InfoCardContent>
                  <p>
                    SoloGram uses OneSignal to manage push notifications.
                    Subscribers are automatically managed through the OneSignal
                    service.
                  </p>
                  <p>
                    To view detailed analytics, subscriber counts, and delivery
                    statistics, please visit the{" "}
                    <a
                      href="https://app.onesignal.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      OneSignal Dashboard
                    </a>
                    .
                  </p>
                  <FeatureList>
                    <FeatureItem>
                      <strong>Segments:</strong> Create custom segments based on
                      user behavior and demographics.
                    </FeatureItem>
                    <FeatureItem>
                      <strong>Device Types:</strong> OneSignal tracks desktop
                      and mobile devices automatically.
                    </FeatureItem>
                    <FeatureItem>
                      <strong>Automated Notifications:</strong> New posts and
                      stories automatically trigger notifications.
                    </FeatureItem>
                    <FeatureItem>
                      <strong>Rich Media:</strong> Support for images, buttons,
                      and rich text in notifications.
                    </FeatureItem>
                  </FeatureList>
                </InfoCardContent>
              </InfoCard>
            </>
          )}

          {/* Send notification confirmation modal */}
          {showSendModal && (
            <Modal>
              <ModalContent>
                <ModalHeader>
                  <h3>Send Notification</h3>
                </ModalHeader>
                <ModalBody>
                  <p>
                    Are you sure you want to send this notification to
                    {targetAudience === "all"
                      ? " ALL subscribers"
                      : " your targeted audience"}
                    ?
                  </p>
                  <MessagePreview>
                    <MessagePreviewTitle>
                      {notificationTitle}
                    </MessagePreviewTitle>
                    <MessagePreviewContent>
                      "{customMessage}"
                    </MessagePreviewContent>
                    {notificationUrl && (
                      <MessagePreviewURL>
                        <FaGlobe />
                        <span>URL: {notificationUrl}</span>
                      </MessagePreviewURL>
                    )}
                    {scheduledTime && (
                      <MessagePreviewSchedule>
                        <FaClock />
                        <span>
                          Scheduled for:{" "}
                          {safeDisplay(
                            formatDate(scheduledTime),
                            "Specified time"
                          )}
                        </span>
                      </MessagePreviewSchedule>
                    )}
                    <MessagePreviewAudience>
                      <FaUsers />
                      <span>
                        Target:{" "}
                        {targetAudience === "all"
                          ? "All Subscribers"
                          : targetAudience === "tags"
                          ? `Tagged Users (${targetTags.join(", ")})`
                          : "Segmented Users"}
                      </span>
                    </MessagePreviewAudience>
                  </MessagePreview>
                </ModalBody>
                <ModalFooter>
                  <CancelButton onClick={() => setShowSendModal(false)}>
                    Cancel
                  </CancelButton>
                  <ConfirmActionButton onClick={confirmSendNotification}>
                    {scheduledTime
                      ? "Schedule Notification"
                      : "Send Notification"}
                  </ConfirmActionButton>
                </ModalFooter>
              </ModalContent>
              <Backdrop onClick={() => setShowSendModal(false)} />
            </Modal>
          )}
        </Container>
      </PageWrapper>
    </ErrorBoundary>
  );
};

// Styled Components
const PageWrapper = styled.div`
  background-color: #121212;
  min-height: 100vh;
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const HeaderRight = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    align-self: flex-end;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  color: #dddddd;
  text-decoration: none;
  transition: color 0.3s;

  &:hover {
    color: #ff7e5f;
  }

  svg {
    margin-right: 0.5rem;
  }
`;

const PageTitle = styled.h1`
  display: flex;
  align-items: center;
  font-size: 1.75rem;
  color: #ffffff;
  margin: 0;

  svg {
    color: #ff7e5f;
    margin-right: 0.75rem;
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #333333;
  color: #dddddd;
  border: none;
  border-radius: 4px;
  padding: 0.5rem;
  width: 36px;
  height: 36px;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: #444444;
    color: #ffffff;
  }

  &:disabled {
    background-color: #2a2a2a;
    cursor: not-allowed;
    opacity: 0.6;
  }

  svg.spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #2a5298;
  color: #ffffff;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background-color: #3a62a8;
  }

  &:disabled {
    background-color: #2a2a2a;
    cursor: not-allowed;
    opacity: 0.6;
  }

  svg {
    font-size: 0.875rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: 1rem;
`;

const LoadingSpinner = styled(FaSpinner)`
  font-size: 2rem;
  color: #ff7e5f;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingMessage = styled.div`
  font-size: 1.125rem;
  color: #aaaaaa;
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  padding: 2rem;
  background-color: #1e1e1e;
  border-radius: 8px;
  margin-bottom: 2rem;

  svg {
    font-size: 2.5rem;
    color: #ff6b6b;
    margin-bottom: 1rem;
  }
`;

const ErrorMessage = styled.div`
  color: #ff6b6b;
  margin-bottom: 1.5rem;
  font-size: 1.125rem;
`;

const RetryButton = styled.button`
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: 500;

  &:hover {
    background-color: #ff6347;
  }
`;

const AccessDenied = styled.div`
  text-align: center;
  padding: 4rem 0;

  svg {
    font-size: 3rem;
    color: #ff7e5f;
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.75rem;
    color: #ffffff;
    margin-bottom: 0.5rem;
  }

  p {
    color: #aaaaaa;
    margin-bottom: 1.5rem;
  }
`;

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: ${(props) => (props.highlight ? "#2a2f4e" : "#1e1e1e")};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  padding: 1.25rem;
  display: flex;
  align-items: center;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const StatIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #ff7e5f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-right: 1rem;

  &.subscribers {
    background-color: #ff7e5f;
  }

  &.active {
    background-color: #7be0ad;
  }

  &.notifications {
    background-color: #00b2ff;
  }

  &.openrate {
    background-color: #feb47b;
  }

  &.last {
    background-color: #a06eff;
  }
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  color: #aaaaaa;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatTrend = styled.div`
  font-size: 0.75rem;
  color: ${(props) =>
    props.positive ? "#7BE0AD" : props.negative ? "#ff6b6b" : "#aaaaaa"};
  margin-top: 0.25rem;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #333333;
  padding-bottom: 0.5rem;
  overflow-x: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: #444444;
    border-radius: 2px;
  }
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${(props) => (props.active ? "#ff7e5f" : "transparent")};
  color: ${(props) => (props.active ? "#ffffff" : "#aaaaaa")};
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  &:hover {
    background-color: ${(props) => (props.active ? "#ff6347" : "#333333")};
    color: #ffffff;
  }
`;

const TabBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  color: inherit;
  border-radius: 999px;
  font-size: 0.75rem;
  min-width: 1.25rem;
  height: 1.25rem;
  padding: 0 0.35rem;
`;

const ContentSection = styled.div`
  position: relative;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #ffffff;
  margin: 0 0 1.25rem 0;
`;

const NotificationForm = styled.form`
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #dddddd;
`;

const NotificationTitleInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444444;
  border-radius: 4px;
  font-size: 1rem;
  background-color: #333333;
  color: #ffffff;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  &:disabled {
    background-color: #272727;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #888888;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444444;
  border-radius: 4px;
  font-size: 1rem;
  background-color: #333333;
  color: #ffffff;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23cccccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  &:disabled {
    background-color: #272727;
    cursor: not-allowed;
  }

  option {
    background-color: #333333;
  }
`;

const NotificationInput = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444444;
  border-radius: 4px;
  font-size: 1rem;
  resize: vertical;
  min-height: 100px;
  margin-bottom: 0.5rem;
  background-color: #333333;
  color: #ffffff;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  &:disabled {
    background-color: #272727;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #888888;
  }
`;

const CharacterCount = styled.div`
  text-align: right;
  font-size: 0.75rem;
  color: #aaaaaa;

  &.warning {
    color: #feb47b;
  }
`;

const FileInputContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FileInputButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #333333;
  color: #dddddd;
  border: 1px solid #444444;
  border-radius: 4px;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;

  &:hover {
    background-color: #444444;
    color: #ffffff;
  }

  &:disabled {
    background-color: #272727;
    cursor: not-allowed;
  }
`;

const FileNameDisplay = styled.div`
  font-size: 0.875rem;
  color: #aaaaaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 300px;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const FieldHint = styled.div`
  font-size: 0.75rem;
  color: #888888;
  margin-top: 0.25rem;
`;

const FieldError = styled.div`
  font-size: 0.75rem;
  color: #ff6b6b;
  margin-top: 0.5rem;
`;

const DateTimeInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444444;
  border-radius: 4px;
  font-size: 1rem;
  background-color: #333333;
  color: #ffffff;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  &:disabled {
    background-color: #272727;
    cursor: not-allowed;
  }
`;

const DateInput = styled.input`
  padding: 0.5rem;
  border: 1px solid #444444;
  border-radius: 4px;
  font-size: 0.875rem;
  background-color: #333333;
  color: #ffffff;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }
`;

const FormSectionDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 2rem 0 1rem;
  gap: 0.75rem;
  color: #ffffff;
  font-weight: 500;

  &::after {
    content: "";
    flex: 1;
    height: 1px;
    background-color: #333333;
  }

  svg {
    color: #ff7e5f;
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const CheckboxWrapper = styled.div`
  display: flex;
  align-items: center;
`;

const Checkbox = styled.input`
  appearance: none;
  width: 1rem;
  height: 1rem;
  border: 2px solid #555555;
  border-radius: 3px;
  margin-right: 0.75rem;
  position: relative;
  cursor: pointer;

  &:checked {
    background-color: #ff7e5f;
    border-color: #ff7e5f;
  }

  &:checked::after {
    content: "✓";
    color: white;
    font-size: 0.75rem;
    position: absolute;
    top: -2px;
    left: 1px;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 126, 95, 0.3);
  }

  &:disabled {
    background-color: #272727;
    border-color: #444444;
    cursor: not-allowed;
  }
`;

const CheckboxLabel = styled.label`
  color: #dddddd;
  cursor: pointer;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const TagButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.75rem;
  background-color: ${(props) => (props.selected ? "#ff7e5f" : "#333333")};
  color: ${(props) => (props.selected ? "white" : "#dddddd")};
  border: none;
  border-radius: 999px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => (props.selected ? "#ff6347" : "#444444")};
  }

  svg {
    font-size: 0.7rem;
  }
`;

const InfoPanel = styled.div`
  display: flex;
  align-items: flex-start;
  background-color: rgba(74, 144, 226, 0.1);
  border-left: 3px solid #4a90e2;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1.5rem;

  svg {
    color: #4a90e2;
    margin-right: 0.75rem;
    margin-top: 0.125rem;
    flex-shrink: 0;
  }
`;

const InfoContent = styled.span`
  color: #bbbbbb;
  font-size: 0.875rem;
  line-height: 1.5;
`;

const ButtonRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ResetButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #333333;
  color: #dddddd;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #444444;
  }

  &:disabled {
    background-color: #2a2a2a;
    cursor: not-allowed;
    color: #888888;
  }
`;

const SendButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
  min-width: 200px;

  &:hover {
    background-color: #ff6347;
  }

  &:disabled {
    background-color: #444444;
    cursor: not-allowed;
    color: #888888;
  }

  svg {
    font-size: 1rem;

    &.spinning {
      animation: spin 1s linear infinite;
    }
  }
`;

const InfoCard = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  margin-bottom: 2rem;
`;

const InfoCardHeader = styled.div`
  background-color: #272727;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #333333;

  svg {
    color: #ff7e5f;
    margin-right: 0.75rem;
    font-size: 1.25rem;
  }

  h3 {
    color: #ffffff;
    margin: 0;
    font-size: 1.25rem;
  }
`;

const InfoCardContent = styled.div`
  padding: 1.5rem;
  color: #dddddd;

  p {
    margin-bottom: 1rem;
    line-height: 1.6;
  }

  a {
    color: #ff7e5f;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const FeatureList = styled.ul`
  margin: 1.5rem 0 0.5rem;
  padding-left: 1.5rem;
`;

const FeatureItem = styled.li`
  margin-bottom: 0.75rem;
  line-height: 1.6;

  strong {
    color: #ffffff;
  }
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  width: 90%;
  max-width: 550px;
  z-index: 1001;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  overflow: hidden;
`;

const ModalHeader = styled.div`
  background-color: #272727;
  padding: 1.25rem;
  border-bottom: 1px solid #333333;

  h3 {
    color: #ffffff;
    margin: 0;
    font-size: 1.25rem;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;

  p {
    color: #dddddd;
    margin-bottom: 1.5rem;
  }
`;

const ModalFooter = styled.div`
  padding: 1.25rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid #333333;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const MessagePreview = styled.div`
  background-color: #272727;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const MessagePreviewTitle = styled.div`
  background-color: #333333;
  color: #ffffff;
  font-weight: 600;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #444444;
`;

const MessagePreviewContent = styled.div`
  padding: 1rem;
  color: #ffffff;
  border-bottom: 1px solid #333333;
`;

const MessagePreviewURL = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: #aaaaaa;
  font-size: 0.875rem;
  border-bottom: 1px solid #333333;

  svg {
    color: #00b2ff;
  }
`;

const MessagePreviewSchedule = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: #aaaaaa;
  font-size: 0.875rem;
  border-bottom: 1px solid #333333;

  svg {
    color: #feb47b;
  }
`;

const MessagePreviewAudience = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: #aaaaaa;
  font-size: 0.875rem;

  svg {
    color: #7be0ad;
  }
`;

const CancelButton = styled.button`
  background-color: #333333;
  color: #dddddd;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: 500;

  &:hover {
    background-color: #444444;
  }

  @media (max-width: 480px) {
    order: 2;
  }
`;

const ConfirmActionButton = styled.button`
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: 600;

  &:hover {
    background-color: #ff6347;
  }

  @media (max-width: 480px) {
    order: 1;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
`;

const TemplateAlert = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: rgba(255, 126, 95, 0.1);
  border-left: 3px solid #ff7e5f;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1rem;
  position: relative;

  svg {
    color: #ff7e5f;
    flex-shrink: 0;
  }

  span {
    color: #dddddd;
    font-size: 0.875rem;
    line-height: 1.5;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #aaaaaa;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;

  &:hover {
    color: #dddddd;
  }
`;

const EmptyState = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 3rem 1.5rem;
  text-align: center;

  svg {
    font-size: 3rem;
    color: #444444;
    margin-bottom: 1rem;
  }

  h3 {
    color: #ffffff;
    margin-bottom: 0.75rem;
  }

  p {
    color: #aaaaaa;
    max-width: 500px;
    margin: 0 auto;
    line-height: 1.6;
  }
`;

const TemplatesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const TemplateCard = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const TemplateHeader = styled.div`
  background-color: #272727;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333333;
`;

const TemplateTitle = styled.div`
  color: #ffffff;
  font-weight: 600;
  font-size: 1rem;
`;

const TemplateActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const TemplateAction = styled.button`
  background: none;
  border: none;
  color: #aaaaaa;
  font-size: 0.875rem;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: #ffffff;
  }

  &.delete:hover {
    background-color: rgba(255, 107, 107, 0.2);
    color: #ff6b6b;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg.spinning {
    animation: spin 1s linear infinite;
  }
`;

const TemplatePreview = styled.div`
  padding: 1rem;
`;

const TemplatePreviewTitle = styled.div`
  color: #ffffff;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const TemplatePreviewContent = styled.div`
  color: #aaaaaa;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const TemplatePreviewURL = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #888888;
  font-size: 0.75rem;

  svg {
    color: #00b2ff;
  }
`;

const HistoryHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
`;

const HistoryFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  align-items: flex-end;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const FilterRow = styled.div`
  display: flex;
  gap: 0.5rem;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const NotificationTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  th,
  td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid #333333;
  }

  th {
    background-color: #272727;
    color: #ffffff;
    font-weight: 500;
    font-size: 0.875rem;
  }

  td {
    color: #dddddd;
    font-size: 0.875rem;
  }

  @media (max-width: 1024px) {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
`;

const TableRow = styled.tr`
  transition: background-color 0.2s;

  &:hover {
    background-color: #272727;
  }
`;

const NotificationTitleCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  span {
    color: #ffffff;
    font-weight: 500;
  }
`;

const NotificationMessage = styled.div`
  color: #aaaaaa;
  font-size: 0.75rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
`;

const AudienceTag = styled.div`
  display: inline-flex;
  align-items: center;
  background-color: rgba(122, 190, 173, 0.2);
  color: #7be0ad;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: capitalize;
`;

const StatusBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.5rem;
  border-radius: 999px;
  font-size: 0.75rem;
  background-color: ${(props) => {
    if (props.status === "completed") return "rgba(122, 190, 173, 0.2)";
    if (props.status === "scheduled") return "rgba(74, 144, 226, 0.2)";
    if (props.status === "cancelled") return "rgba(255, 107, 107, 0.2)";
    return "rgba(255, 255, 255, 0.1)";
  }};
  color: ${(props) => {
    if (props.status === "completed") return "#7BE0AD";
    if (props.status === "scheduled") return "#4a90e2";
    if (props.status === "cancelled") return "#ff6b6b";
    return "#aaaaaa";
  }};

  svg {
    font-size: 0.75rem;
  }
`;

const PerformanceMetrics = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.75rem;
`;

const MetricItem = styled.div`
  color: #aaaaaa;

  span {
    color: #ffffff;
    margin-right: 0.25rem;
  }

  &.positive {
    color: #7be0ad;
  }

  &.negative {
    color: #ff6b6b;
  }
`;

const ActionButton = styled.button`
  background-color: #333333;
  color: #dddddd;
  border: none;
  border-radius: 4px;
  padding: 0.35rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #444444;
    color: #ffffff;
  }

  &.cancel:hover {
    background-color: #ff6b6b;
    color: #ffffff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  background-color: #333333;
  color: #dddddd;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;

  &:hover:not(:disabled) {
    background-color: #444444;
    color: #ffffff;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PaginationInfo = styled.div`
  color: #aaaaaa;
  font-size: 0.875rem;
  padding: 0 1rem;
`;

const PaginationSelect = styled.select`
  padding: 0.5rem;
  background-color: #333333;
  color: #dddddd;
  border: 1px solid #444444;
  border-radius: 4px;
  font-size: 0.875rem;
  margin-left: 1rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
`;

const ChartTitle = styled.h3`
  font-size: 1.125rem;
  color: #ffffff;
  margin-top: 0;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: #ff7e5f;
  }
`;

const BestPracticesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const BestPracticeCard = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: transform 0.3s;

  &:hover {
    transform: translateY(-3px);
  }
`;

const BestPracticeIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #2a2f4e;
  color: #ff7e5f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
`;

const BestPracticeContent = styled.div`
  h3 {
    color: #ffffff;
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
  }

  p {
    color: #aaaaaa;
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
  }
`;

export default SubscriberAdmin;
