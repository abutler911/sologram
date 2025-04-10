// client/src/pages/Analytics.js
import React, { useState, useEffect, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  FaChartBar,
  FaArrowLeft,
  FaHeart,
  FaEye,
  FaCalendarAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaInfoCircle,
  FaRedoAlt,
  FaDownload,
  FaUsers,
  FaComments,
  FaShareAlt,
  FaFire,
  FaClock,
  FaSearch,
  FaTags,
  FaChartLine,
  FaChartPie,
  FaFilter,
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";
import { format } from "date-fns";

// Import chart components
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const Analytics = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";
  const csvLinkRef = useRef(null);

  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalUsers: 0,
    recentPosts: [],
    popularPosts: [],
    postsByMonth: [],
    engagementRate: 0,
    topCategories: [],
    userActivityByHour: [],
    userGrowth: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("month"); // all, year, month, week
  const [activeChart, setActiveChart] = useState("posts"); // posts, engagement, categories, users
  const [refreshKey, setRefreshKey] = useState(0);
  const [csvData, setCsvData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [availableCategories, setAvailableCategories] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isAuthenticated || !isAdmin) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // In a real implementation, you'd have dedicated endpoints for analytics
        // Here we'll simulate by gathering data from existing endpoints
        const [postsResponse, usersResponse, commentsResponse] =
          await Promise.all([
            axios.get("/api/posts"),
            axios.get("/api/users"),
            axios.get("/api/comments"),
          ]);

        if (postsResponse.data.success && usersResponse.data.success) {
          const posts = postsResponse.data.data || [];
          const users = usersResponse.data.data || [];
          const comments = commentsResponse.data.success
            ? commentsResponse.data.data || []
            : [];

          // Extract all categories for filtering
          const categories = [
            ...new Set(posts.flatMap((post) => post.categories || [])),
          ];
          setAvailableCategories(categories);

          // Filter posts based on search and category
          const filteredPosts = posts.filter((post) => {
            const matchesSearch =
              searchTerm === "" ||
              post.caption.toLowerCase().includes(searchTerm.toLowerCase()) ||
              post.content?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesCategory =
              filterCategory === "all" ||
              (post.categories && post.categories.includes(filterCategory));

            return matchesSearch && matchesCategory;
          });

          // Process posts to extract analytics
          const totalPosts = filteredPosts.length;
          const totalLikes = filteredPosts.reduce(
            (sum, post) => sum + (post.likes || 0),
            0
          );
          const totalViews = filteredPosts.reduce(
            (sum, post) => sum + (post.views || 0),
            0
          );
          const totalComments = comments.filter((comment) =>
            filteredPosts.some((post) => post._id === comment.postId)
          ).length;

          const totalShares = filteredPosts.reduce(
            (sum, post) => sum + (post.shares || 0),
            0
          );

          // Calculate engagement rate (likes + comments + shares) / views
          const engagementRate =
            totalViews > 0
              ? (
                  ((totalLikes + totalComments + totalShares) / totalViews) *
                  100
                ).toFixed(2)
              : 0;

          // Sort by date for recent posts
          const sortedByDate = [...filteredPosts].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );

          // Sort by engagement for popular posts (likes + comments + views)
          const sortedByEngagement = [...filteredPosts].sort(
            (a, b) =>
              (b.likes || 0) +
              (b.comments?.length || 0) +
              (b.views || 0) -
              ((a.likes || 0) + (a.comments?.length || 0) + (a.views || 0))
          );

          // Group by month for chart data
          const postsByMonth = groupPostsByMonth(filteredPosts);

          // Get top categories
          const categoryCount = {};
          filteredPosts.forEach((post) => {
            if (post.categories) {
              post.categories.forEach((category) => {
                categoryCount[category] = (categoryCount[category] || 0) + 1;
              });
            }
          });

          const topCategories = Object.entries(categoryCount)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

          // User activity by hour (simulate data)
          const userActivityByHour = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            users: Math.floor(Math.random() * 100) + 10,
          }));

          // User growth over time (simulate data)
          const now = new Date();
          const userGrowth = Array.from({ length: 12 }, (_, i) => {
            const month = new Date(now.getFullYear(), now.getMonth() - 11 + i);
            return {
              month: format(month, "MMM yyyy"),
              users: Math.floor(50 + i * 25 + Math.random() * 30),
            };
          });

          // Prepare CSV data for export
          const csvData = [
            [
              "Date",
              "Posts",
              "Views",
              "Likes",
              "Comments",
              "Shares",
              "Engagement Rate (%)",
            ],
            ...postsByMonth.map((month) => [
              month.label,
              month.count,
              month.views || 0,
              month.likes || 0,
              month.comments || 0,
              month.shares || 0,
              month.engagementRate || 0,
            ]),
          ]
            .map((row) => row.join(","))
            .join("\\n");

          setCsvData(csvData);

          setStats({
            totalPosts,
            totalViews,
            totalLikes,
            totalComments,
            totalShares,
            totalUsers: users.length,
            recentPosts: sortedByDate.slice(0, 5),
            popularPosts: sortedByEngagement.slice(0, 5),
            postsByMonth,
            engagementRate,
            topCategories,
            userActivityByHour,
            userGrowth,
          });
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
        setError("Failed to load analytics data. Please try again.");
        toast.error("Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [
    isAuthenticated,
    isAdmin,
    timeRange,
    refreshKey,
    searchTerm,
    filterCategory,
  ]);

  const groupPostsByMonth = (posts) => {
    const months = {};

    // Filter posts based on time range
    const filteredPosts = posts.filter((post) => {
      const postDate = new Date(post.createdAt);
      const now = new Date();

      if (timeRange === "week") {
        // Posts from last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return postDate >= weekAgo;
      } else if (timeRange === "month") {
        // Posts from last 30 days
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        return postDate >= monthAgo;
      } else if (timeRange === "year") {
        // Posts from last 365 days
        const yearAgo = new Date();
        yearAgo.setDate(yearAgo.getDate() - 365);
        return postDate >= yearAgo;
      }

      // Default: all time
      return true;
    });

    // Group by month
    filteredPosts.forEach((post) => {
      const date = new Date(post.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!months[monthKey]) {
        months[monthKey] = {
          label: new Date(
            date.getFullYear(),
            date.getMonth()
          ).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          }),
          count: 0,
          likes: 0,
          views: 0,
          comments: 0,
          shares: 0,
          engagementRate: 0,
        };
      }

      months[monthKey].count += 1;
      months[monthKey].likes += post.likes || 0;
      months[monthKey].views += post.views || 0;
      months[monthKey].comments += post.comments?.length || 0;
      months[monthKey].shares += post.shares || 0;

      // Calculate engagement rate for each month
      const totalViews = months[monthKey].views;
      const totalInteractions =
        months[monthKey].likes +
        months[monthKey].comments +
        months[monthKey].shares;
      months[monthKey].engagementRate =
        totalViews > 0
          ? ((totalInteractions / totalViews) * 100).toFixed(2)
          : 0;
    });

    // Convert to array and sort by date
    return Object.values(months).sort((a, b) => {
      const [yearA, monthA] = a.label.split(" ");
      const [yearB, monthB] = b.label.split(" ");

      if (yearA !== yearB) return yearA - yearB;

      const monthOrder = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
      };

      return monthOrder[monthA] - monthOrder[monthB];
    });
  };

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1);
    toast.success("Refreshing analytics data...");
  };

  const handleExportCSV = () => {
    if (!csvData) return;

    // Create a blob with the CSV data
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    // Create a temporary link element and trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_export_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Analytics data exported successfully");
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Chart colors
  const COLORS = [
    "#FF7E5F",
    "#FEB47B",
    "#7BE0AD",
    "#00B2FF",
    "#A06EFF",
    "#FF61A6",
  ];

  if (!isAuthenticated || !isAdmin) {
    return (
      <MainLayout>
        <Wrapper>
          <AccessDenied>
            <FaExclamationTriangle />
            <h2>Access Denied</h2>
            <p>You must be an admin to view this page.</p>
            <BackLink to="/">Return to Home</BackLink>
          </AccessDenied>
        </Wrapper>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Wrapper>
        <Header>
          <HeaderLeft>
            <BackLink to="/admin">
              <FaArrowLeft />
              <span>Back to Admin</span>
            </BackLink>

            <PageTitle>
              <FaChartBar />
              <span>Analytics Dashboard</span>
            </PageTitle>
          </HeaderLeft>

          <HeaderRight>
            <SearchContainer>
              <SearchInput
                type="text"
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <SearchIcon>
                <FaSearch />
              </SearchIcon>
            </SearchContainer>
            <ExportButton
              onClick={handleExportCSV}
              disabled={loading || !csvData}
            >
              <FaDownload />
              <span>Export Data</span>
            </ExportButton>
            <RefreshButton onClick={handleRefresh} disabled={loading}>
              <FaRedoAlt />
              <span>{loading ? "Refreshing..." : "Refresh"}</span>
            </RefreshButton>
          </HeaderRight>
        </Header>

        <FilterSection>
          <TimeRangeSelector>
            <TimeRangeButton
              active={timeRange === "all"}
              onClick={() => setTimeRange("all")}
            >
              All Time
            </TimeRangeButton>
            <TimeRangeButton
              active={timeRange === "year"}
              onClick={() => setTimeRange("year")}
            >
              Last Year
            </TimeRangeButton>
            <TimeRangeButton
              active={timeRange === "month"}
              onClick={() => setTimeRange("month")}
            >
              Last 30 Days
            </TimeRangeButton>
            <TimeRangeButton
              active={timeRange === "week"}
              onClick={() => setTimeRange("week")}
            >
              Last 7 Days
            </TimeRangeButton>
          </TimeRangeSelector>

          <CategoryFilter>
            <FilterLabel>
              <FaFilter /> Filter by Category:
            </FilterLabel>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {availableCategories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </CategoryFilter>
        </FilterSection>

        {loading ? (
          <LoadingContainer>
            <LoadingSpinner />
            <p>Loading analytics data...</p>
          </LoadingContainer>
        ) : error ? (
          <ErrorContainer>
            <FaExclamationTriangle />
            <ErrorMessage>{error}</ErrorMessage>
            <RetryButton onClick={handleRefresh}>Try Again</RetryButton>
          </ErrorContainer>
        ) : (
          <>
            <StatsCards>
              <StatCard>
                <StatIcon>
                  <FaChartBar />
                </StatIcon>
                <StatInfo>
                  <StatValue>{stats.totalPosts}</StatValue>
                  <StatLabel>Total Posts</StatLabel>
                </StatInfo>
              </StatCard>

              <StatCard>
                <StatIcon>
                  <FaEye />
                </StatIcon>
                <StatInfo>
                  <StatValue>{stats.totalViews}</StatValue>
                  <StatLabel>Total Views</StatLabel>
                </StatInfo>
              </StatCard>

              <StatCard>
                <StatIcon className="likes">
                  <FaHeart />
                </StatIcon>
                <StatInfo>
                  <StatValue>{stats.totalLikes}</StatValue>
                  <StatLabel>Total Likes</StatLabel>
                </StatInfo>
              </StatCard>

              <StatCard>
                <StatIcon className="comments">
                  <FaComments />
                </StatIcon>
                <StatInfo>
                  <StatValue>{stats.totalComments}</StatValue>
                  <StatLabel>Total Comments</StatLabel>
                </StatInfo>
              </StatCard>

              <StatCard>
                <StatIcon className="shares">
                  <FaShareAlt />
                </StatIcon>
                <StatInfo>
                  <StatValue>{stats.totalShares}</StatValue>
                  <StatLabel>Total Shares</StatLabel>
                </StatInfo>
              </StatCard>

              <StatCard>
                <StatIcon className="users">
                  <FaUsers />
                </StatIcon>
                <StatInfo>
                  <StatValue>{stats.totalUsers}</StatValue>
                  <StatLabel>Total Users</StatLabel>
                </StatInfo>
              </StatCard>

              <StatCard highlight>
                <StatIcon className="engagement">
                  <FaFire />
                </StatIcon>
                <StatInfo>
                  <StatValue>{stats.engagementRate}%</StatValue>
                  <StatLabel>Engagement Rate</StatLabel>
                </StatInfo>
              </StatCard>
            </StatsCards>

            <ChartSection>
              <ChartTabs>
                <ChartTab
                  active={activeChart === "posts"}
                  onClick={() => setActiveChart("posts")}
                >
                  <FaChartBar />
                  <span>Content Performance</span>
                </ChartTab>
                <ChartTab
                  active={activeChart === "engagement"}
                  onClick={() => setActiveChart("engagement")}
                >
                  <FaChartLine />
                  <span>Engagement Metrics</span>
                </ChartTab>
                <ChartTab
                  active={activeChart === "categories"}
                  onClick={() => setActiveChart("categories")}
                >
                  <FaChartPie />
                  <span>Top Categories</span>
                </ChartTab>
                <ChartTab
                  active={activeChart === "users"}
                  onClick={() => setActiveChart("users")}
                >
                  <FaUsers />
                  <span>User Activity</span>
                </ChartTab>
              </ChartTabs>

              <ChartContainer>
                {activeChart === "posts" && (
                  <>
                    <ChartTitle>Posts by Month</ChartTitle>
                    {stats.postsByMonth.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={stats.postsByMonth}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#333333"
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fill: "#aaaaaa" }}
                            angle={-45}
                            textAnchor="end"
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
                          <Legend wrapperStyle={{ color: "#aaaaaa" }} />
                          <Bar dataKey="count" name="Posts" fill="#FF7E5F" />
                          <Bar dataKey="views" name="Views" fill="#7BE0AD" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <NoDataMessage>
                        <FaInfoCircle />
                        <span>
                          No data available for the selected time range
                        </span>
                      </NoDataMessage>
                    )}
                  </>
                )}

                {activeChart === "engagement" && (
                  <>
                    <ChartTitle>Engagement Over Time</ChartTitle>
                    {stats.postsByMonth.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart
                          data={stats.postsByMonth}
                          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#333333"
                          />
                          <XAxis
                            dataKey="label"
                            tick={{ fill: "#aaaaaa" }}
                            angle={-45}
                            textAnchor="end"
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
                          <Legend wrapperStyle={{ color: "#aaaaaa" }} />
                          <Line
                            type="monotone"
                            dataKey="likes"
                            name="Likes"
                            stroke="#FF7E5F"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="comments"
                            name="Comments"
                            stroke="#00B2FF"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="shares"
                            name="Shares"
                            stroke="#FEB47B"
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="engagementRate"
                            name="Engagement Rate (%)"
                            stroke="#A06EFF"
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <NoDataMessage>
                        <FaInfoCircle />
                        <span>
                          No engagement data available for the selected time
                          range
                        </span>
                      </NoDataMessage>
                    )}
                  </>
                )}

                {activeChart === "categories" && (
                  <>
                    <ChartTitle>Top Content Categories</ChartTitle>
                    {stats.topCategories.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={stats.topCategories}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="count"
                            nameKey="name"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {stats.topCategories.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name, props) => [
                              value,
                              props.payload.name,
                            ]}
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
                          <Legend wrapperStyle={{ color: "#aaaaaa" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <NoDataMessage>
                        <FaInfoCircle />
                        <span>No category data available</span>
                      </NoDataMessage>
                    )}
                  </>
                )}

                {activeChart === "users" && (
                  <>
                    <ChartTitle>User Activity & Growth</ChartTitle>
                    <ChartSplitContainer>
                      <ChartBox>
                        <ChartSubtitle>
                          <FaClock />
                          <span>User Activity by Hour</span>
                        </ChartSubtitle>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart
                            data={stats.userActivityByHour}
                            margin={{
                              top: 10,
                              right: 10,
                              left: 10,
                              bottom: 20,
                            }}
                          >
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
                              formatter={(value) => [`${value} users`]}
                              labelFormatter={(hour) =>
                                `${hour}:00 - ${hour + 1}:00`
                              }
                            />
                            <Bar dataKey="users" fill="#00B2FF" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartBox>

                      <ChartBox>
                        <ChartSubtitle>
                          <FaUsers />
                          <span>User Growth</span>
                        </ChartSubtitle>
                        <ResponsiveContainer width="100%" height={220}>
                          <LineChart
                            data={stats.userGrowth}
                            margin={{
                              top: 10,
                              right: 10,
                              left: 10,
                              bottom: 20,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#333333"
                            />
                            <XAxis dataKey="month" tick={{ fill: "#aaaaaa" }} />
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
                              dataKey="users"
                              stroke="#A06EFF"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartBox>
                    </ChartSplitContainer>
                  </>
                )}
              </ChartContainer>
            </ChartSection>

            <PostsSection>
              <SectionGrid>
                <PostsList>
                  <SectionTitle>
                    <FaCalendarAlt />
                    <span>Recent Posts</span>
                  </SectionTitle>
                  {stats.recentPosts.length > 0 ? (
                    <StyledList>
                      {stats.recentPosts.map((post) => (
                        <PostItem key={post._id}>
                          <PostLink to={`/post/${post._id}`}>
                            <PostTitle>{post.caption}</PostTitle>
                            <PostMeta>
                              <PostDate>
                                <FaCalendarAlt />
                                <span>{formatDate(post.createdAt)}</span>
                              </PostDate>
                              <PostMetrics>
                                <PostMetric>
                                  <FaEye />
                                  <span>{post.views || 0}</span>
                                </PostMetric>
                                <PostMetric className="likes">
                                  <FaHeart />
                                  <span>{post.likes || 0}</span>
                                </PostMetric>
                                <PostMetric className="comments">
                                  <FaComments />
                                  <span>{post.comments?.length || 0}</span>
                                </PostMetric>
                              </PostMetrics>
                            </PostMeta>
                            {post.categories && post.categories.length > 0 && (
                              <PostCategories>
                                <FaTags />
                                {post.categories.map((category, index) => (
                                  <PostCategory key={index}>
                                    {category}
                                  </PostCategory>
                                ))}
                              </PostCategories>
                            )}
                          </PostLink>
                        </PostItem>
                      ))}
                    </StyledList>
                  ) : (
                    <NoDataMessage>No posts found</NoDataMessage>
                  )}
                </PostsList>

                <PostsList>
                  <SectionTitle>
                    <FaFire />
                    <span>Popular Posts</span>
                  </SectionTitle>
                  {stats.popularPosts.length > 0 ? (
                    <StyledList>
                      {stats.popularPosts.map((post, index) => (
                        <PostItem key={post._id}>
                          <PopularityRank>{index + 1}</PopularityRank>
                          <PostLink to={`/post/${post._id}`}>
                            <PostTitle>{post.caption}</PostTitle>
                            <PostMeta>
                              <PostDate>
                                <FaCalendarAlt />
                                <span>{formatDate(post.createdAt)}</span>
                              </PostDate>
                              <PostMetrics>
                                <PostMetric>
                                  <FaEye />
                                  <span>{post.views || 0}</span>
                                </PostMetric>
                                <PostMetric className="likes">
                                  <FaHeart />
                                  <span>{post.likes || 0}</span>
                                </PostMetric>
                                <PostMetric className="comments">
                                  <FaComments />
                                  <span>{post.comments?.length || 0}</span>
                                </PostMetric>
                              </PostMetrics>
                            </PostMeta>
                            {post.categories && post.categories.length > 0 && (
                              <PostCategories>
                                <FaTags />
                                {post.categories.map((category, index) => (
                                  <PostCategory key={index}>
                                    {category}
                                  </PostCategory>
                                ))}
                              </PostCategories>
                            )}
                          </PostLink>
                        </PostItem>
                      ))}
                    </StyledList>
                  ) : (
                    <NoDataMessage>No posts found</NoDataMessage>
                  )}
                </PostsList>
              </SectionGrid>
            </PostsSection>
          </>
        )}
      </Wrapper>
    </MainLayout>
  );
};

// Styled Components
const Wrapper = styled.div`
  background: #121212;
  min-height: 100vh;
  padding: 2rem 1rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;

  @media (max-width: 1024px) {
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
  align-items: center;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    justify-content: flex-end;
    width: 100%;
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
  gap: 0.5rem;
  background-color: #333333;
  color: #dddddd;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #444444;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
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
  transition: background-color 0.3s;

  &:hover {
    background-color: #3a62a8;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 200px;
  max-width: 300px;

  @media (max-width: 768px) {
    min-width: 100%;
    max-width: 100%;
    order: -1;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  border-radius: 4px;
  border: 1px solid #333333;
  background-color: #1e1e1e;
  color: #ffffff;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #aaaaaa;
`;

const FilterSection = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const TimeRangeSelector = styled.div`
  display: flex;
  gap: 0.75rem;

  @media (max-width: 768px) {
    width: 100%;
    overflow-x: auto;
    padding-bottom: 0.5rem;
  }
`;

const TimeRangeButton = styled.button`
  background-color: ${(props) => (props.active ? "#ff7e5f" : "#333333")};
  color: ${(props) => (props.active ? "#ffffff" : "#dddddd")};
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;
  font-weight: ${(props) => (props.active ? "600" : "400")};
  white-space: nowrap;

  &:hover {
    background-color: ${(props) => (props.active ? "#ff6347" : "#444444")};
  }
`;

const CategoryFilter = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const FilterLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #dddddd;
  font-size: 0.875rem;
  white-space: nowrap;

  svg {
    color: #aaaaaa;
  }
`;

const Select = styled.select`
  background-color: #1e1e1e;
  color: #ffffff;
  border: 1px solid #333333;
  border-radius: 4px;
  padding: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #ff7e5f;
  }

  @media (max-width: 768px) {
    flex: 1;
  }
`;

const StatsCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: ${(props) => (props.highlight ? "#2a2f4e" : "#1e1e1e")};
  border-radius: 8px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: transform 0.3s, box-shadow 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
`;

const StatIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  margin-right: 1rem;

  &.likes {
    background-color: #e74c3c;
  }

  &.comments {
    background-color: #f39c12;
  }

  &.shares {
    background-color: #27ae60;
  }

  &.users {
    background-color: #9b59b6;
  }

  &.engagement {
    background-color: #ff7e5f;
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

const ChartSection = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const ChartTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #333333;
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

const ChartTab = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${(props) => (props.active ? "#ff7e5f" : "transparent")};
  color: ${(props) => (props.active ? "#ffffff" : "#aaaaaa")};
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.875rem;
  white-space: nowrap;

  &:hover {
    background-color: ${(props) => (props.active ? "#ff6347" : "#333333")};
    color: #ffffff;
  }
`;

const ChartContainer = styled.div`
  padding: 1rem 0;
`;

const ChartTitle = styled.h2`
  font-size: 1.25rem;
  color: #ffffff;
  margin-top: 0;
  margin-bottom: 1.5rem;
  text-align: center;
`;

const ChartSplitContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;

  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const ChartBox = styled.div`
  background-color: #242424;
  border-radius: 8px;
  padding: 1rem;
`;

const ChartSubtitle = styled.h3`
  font-size: 1rem;
  color: #ffffff;
  margin-top: 0;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: #aaaaaa;
  }
`;

const PostsSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const PostsList = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  color: #ffffff;
  margin-top: 0;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    color: #ff7e5f;
  }
`;

const StyledList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const PostItem = styled.li`
  position: relative;
  border-bottom: 1px solid #333333;
  padding: 1rem 0;

  &:last-child {
    border-bottom: none;
  }
`;

const PopularityRank = styled.div`
  position: absolute;
  top: 1rem;
  left: -10px;
  width: 24px;
  height: 24px;
  background-color: ${(props) => {
    if (props.children === 1) return "#FFD700";
    if (props.children === 2) return "#C0C0C0";
    if (props.children === 3) return "#CD7F32";
    return "#333333";
  }};
  color: ${(props) => {
    if (props.children <= 3) return "#000000";
    return "#ffffff";
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
`;

const PostLink = styled(Link)`
  text-decoration: none;
  display: block;
  padding-left: 1rem;

  &:hover h3 {
    color: #ff7e5f;
  }
`;

const PostTitle = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  transition: color 0.3s;
`;

const PostMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const PostDate = styled.div`
  display: flex;
  align-items: center;
  color: #aaaaaa;
  font-size: 0.75rem;

  svg {
    margin-right: 0.25rem;
  }
`;

const PostMetrics = styled.div`
  display: flex;
  gap: 0.75rem;
`;

const PostMetric = styled.div`
  display: flex;
  align-items: center;
  color: #aaaaaa;
  font-size: 0.75rem;

  svg {
    margin-right: 0.25rem;
  }

  &.likes {
    color: #e74c3c;
  }

  &.comments {
    color: #f39c12;
  }
`;

const PostCategories = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;

  svg {
    color: #888888;
    font-size: 0.75rem;
  }
`;

const PostCategory = styled.span`
  background-color: #2c2c2c;
  color: #aaaaaa;
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;

  p {
    color: #aaaaaa;
    margin-top: 1rem;
  }
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

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;

  svg {
    font-size: 2.5rem;
    color: #e74c3c;
    margin-bottom: 1rem;
  }
`;

const ErrorMessage = styled.p`
  color: #e74c3c;
  margin-bottom: 1rem;
`;

const RetryButton = styled.button`
  background-color: #ff7e5f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #ff6347;
  }
`;

const AccessDenied = styled.div`
  text-align: center;
  padding: 4rem 0;

  svg {
    font-size: 3rem;
    color: #e74c3c;
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

const NoDataMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #aaaaaa;
  text-align: center;

  svg {
    margin-right: 0.5rem;
    color: #888888;
  }
`;

export default Analytics;
