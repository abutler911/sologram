// client/src/pages/Analytics.js
import React, { useState, useEffect, useContext } from "react";
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
} from "react-icons/fa";
import { AuthContext } from "../context/AuthContext";
import MainLayout from "../components/layout/MainLayout";

const Analytics = () => {
  const { isAuthenticated, user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin";

  const [stats, setStats] = useState({
    totalPosts: 0,
    totalViews: 0,
    totalLikes: 0,
    recentPosts: [],
    popularPosts: [],
    postsByMonth: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("all"); // all, month, week
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!isAuthenticated || !isAdmin) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // In a real implementation, you'd have a dedicated endpoint for analytics
        // For now, we'll simulate by gathering data from existing endpoints
        const postsResponse = await axios.get("/api/posts");

        if (postsResponse.data.success) {
          const posts = postsResponse.data.data || [];

          // Process posts to extract analytics
          const totalPosts = posts.length;
          const totalLikes = posts.reduce(
            (sum, post) => sum + (post.likes || 0),
            0
          );

          // Sort by date for recent posts
          const sortedByDate = [...posts].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );

          // Sort by likes for popular posts
          const sortedByLikes = [...posts].sort(
            (a, b) => (b.likes || 0) - (a.likes || 0)
          );

          // Group by month for chart data
          const postsByMonth = groupPostsByMonth(posts);

          setStats({
            totalPosts,
            totalViews: totalPosts * 10, // Simulated view count
            totalLikes,
            recentPosts: sortedByDate.slice(0, 5),
            popularPosts: sortedByLikes.slice(0, 5),
            postsByMonth,
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
  }, [isAuthenticated, isAdmin, timeRange, refreshKey]);

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
        };
      }

      months[monthKey].count += 1;
      months[monthKey].likes += post.likes || 0;
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
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

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
          <BackLink to="/admin">
            <FaArrowLeft />
            <span>Back to Admin</span>
          </BackLink>

          <PageTitle>
            <FaChartBar />
            <span>Analytics Dashboard</span>
          </PageTitle>

          <RefreshButton onClick={handleRefresh} disabled={loading}>
            <FaRedoAlt />
            <span>{loading ? "Refreshing..." : "Refresh"}</span>
          </RefreshButton>
        </Header>

        <TimeRangeSelector>
          <TimeRangeButton
            active={timeRange === "all"}
            onClick={() => setTimeRange("all")}
          >
            All Time
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
            </StatsCards>

            <PostsChart>
              {stats.postsByMonth.length > 0 ? (
                <>
                  <ChartTitle>Posts by Month</ChartTitle>
                  <ChartContainer>
                    {stats.postsByMonth.map((month, index) => (
                      <ChartBar key={index}>
                        <BarValue
                          style={{
                            height: `${
                              (month.count /
                                Math.max(
                                  ...stats.postsByMonth.map((m) => m.count)
                                )) *
                              100
                            }%`,
                          }}
                        >
                          <span>{month.count}</span>
                        </BarValue>
                        <BarLabel>{month.label}</BarLabel>
                      </ChartBar>
                    ))}
                  </ChartContainer>
                </>
              ) : (
                <NoDataMessage>
                  <FaInfoCircle />
                  <span>No data available for the selected time range</span>
                </NoDataMessage>
              )}
            </PostsChart>

            <PostsSection>
              <SectionGrid>
                <PostsList>
                  <SectionTitle>Recent Posts</SectionTitle>
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
                              <PostLikes>
                                <FaHeart />
                                <span>{post.likes || 0}</span>
                              </PostLikes>
                            </PostMeta>
                          </PostLink>
                        </PostItem>
                      ))}
                    </StyledList>
                  ) : (
                    <NoDataMessage>No posts found</NoDataMessage>
                  )}
                </PostsList>

                <PostsList>
                  <SectionTitle>Popular Posts</SectionTitle>
                  {stats.popularPosts.length > 0 ? (
                    <StyledList>
                      {stats.popularPosts.map((post) => (
                        <PostItem key={post._id}>
                          <PostLink to={`/post/${post._id}`}>
                            <PostTitle>{post.caption}</PostTitle>
                            <PostMeta>
                              <PostDate>
                                <FaCalendarAlt />
                                <span>{formatDate(post.createdAt)}</span>
                              </PostDate>
                              <PostLikes>
                                <FaHeart />
                                <span>{post.likes || 0}</span>
                              </PostLikes>
                            </PostMeta>
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
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
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

  @media (max-width: 768px) {
    margin-bottom: 0.5rem;
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

  @media (max-width: 768px) {
    align-self: flex-end;
  }
`;

const TimeRangeSelector = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    margin-bottom: 1.5rem;
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

  &:hover {
    background-color: ${(props) => (props.active ? "#ff6347" : "#444444")};
  }
`;

const StatsCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const StatIcon = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: #3498db;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-right: 1rem;

  &.likes {
    background-color: #e74c3c;
  }
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 1.75rem;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  color: #aaaaaa;
  font-size: 0.875rem;
`;

const PostsChart = styled.div`
  background-color: #1e1e1e;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

const ChartTitle = styled.h2`
  font-size: 1.25rem;
  color: #ffffff;
  margin-top: 0;
  margin-bottom: 1.5rem;
`;

const ChartContainer = styled.div`
  display: flex;
  align-items: flex-end;
  height: 250px;
  gap: 2%;
  padding-bottom: 2rem;
  overflow-x: auto;

  @media (max-width: 768px) {
    padding-bottom: 3rem;
  }
`;

const ChartBar = styled.div`
  flex: 1;
  min-width: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const BarValue = styled.div`
  width: 100%;
  min-height: 30px;
  background-color: #ff7e5f;
  border-radius: 4px 4px 0 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 0.5rem;
  transition: height 0.5s ease;

  span {
    font-size: 0.875rem;
    font-weight: 600;
    color: white;
  }
`;

const BarLabel = styled.div`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #aaaaaa;
  text-align: center;
  transform: rotate(-45deg) translateX(-1rem);
  transform-origin: left;
  white-space: nowrap;

  @media (max-width: 768px) {
    transform: rotate(-45deg) translateX(-0.5rem);
    font-size: 0.7rem;
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
`;

const StyledList = styled.ul`
  list-style-type: none;
  padding: 0;
  margin: 0;
`;

const PostItem = styled.li`
  border-bottom: 1px solid #333333;
  padding: 1rem 0;

  &:last-child {
    border-bottom: none;
  }
`;

const PostLink = styled(Link)`
  text-decoration: none;
  display: block;

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

const PostLikes = styled.div`
  display: flex;
  align-items: center;
  color: #e74c3c;
  font-size: 0.75rem;

  svg {
    margin-right: 0.25rem;
  }
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
