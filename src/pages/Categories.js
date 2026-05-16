import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  getCurrentLeaveCategoriesResponse,
  leaveCategoriesApi,
} from '../redux/LeaveSlice';

const formatValue = (value, fallback = 'Not available') =>
  value === null || value === undefined || value === '' ? fallback : String(value);

function CategoryCard({ category }) {
  const isActive = Number(category.status) === 1;

  return (
    <View style={styles.categoryCard}>
      {/* Decorative Brand Accent Tag on Left Side */}
      <View style={[styles.cardAccent, isActive ? styles.accentActive : styles.accentInactive]} />
      
      <View style={styles.cardMainBody}>
        <View style={styles.categoryHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.categoryName} numberOfLines={2}>
              {formatValue(category.leave_cat_name, 'Leave Category')}
            </Text>
           
          </View>
          
          {/* Vibrant High-Contrast Status Pill */}
          <View style={[styles.statusPill, isActive ? styles.statusActive : styles.statusInactive]}>
            <Text style={styles.statusText}>
              {isActive ? 'ACTIVE' : 'INACTIVE'}
            </Text>
          </View>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.infoGrid}>
          {/* Highlighted Metric Badge Component */}
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>DAYS PER YEAR</Text>
            <View style={styles.daysBadge}>
              <Text style={styles.daysText}>{formatValue(category.days_per_year)} Days</Text>
            </View>
          </View>

          {/* Core Text Info Block */}
          <View style={[styles.infoCell, { flex: 1.5 }]}>
            <Text style={styles.infoLabel}>DESCRIPTION</Text>
            <Text style={styles.infoValue} numberOfLines={3}>
              {formatValue(category.leave_description)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function Categories() {
  const [categoryResponse, setCategoryResponse] = useState(
    getCurrentLeaveCategoriesResponse()
  );
  const [loading, setLoading] = useState(!getCurrentLeaveCategoriesResponse());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadCategories = useCallback(async ({ refresh = false } = {}) => {
    try {
      refresh ? setRefreshing(true) : setLoading(true);
      const response = await leaveCategoriesApi();
      setCategoryResponse(response);
      setError('');
    } catch (categoryError) {
      setError(categoryError.message || 'Unable to load leave categories.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const categories = categoryResponse?.data?.data?.categories || [];

  return (
    <ScrollView
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadCategories({ refresh: true })}
          tintColor="#f08c3c"
        />
      }
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      style={styles.scrollView}
    >
      {/* High-Impact Solid Color Summary Banner */}
      <View style={styles.summaryBand}>
        <View style={styles.summaryTextWrapper}>
          <Text style={styles.eyebrow}>LEAVE CATEGORIES</Text>
          <Text style={styles.summaryLabel}>Total Active Configuration</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.summaryValue}>{categories.length}</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.stateCard}>
          <ActivityIndicator color="#2664b4" size="large" />
          <Text style={styles.stateText}>FETCHING CATEGORIES...</Text>
        </View>
      )}

      {!!error && (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>LEAVE CATEGORY API ERROR</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>ALL AVAILABLE CATEGORIES</Text>
      
      {categories.length ? (
        categories.map((category) => (
          <CategoryCard key={category.leave_cat_id} category={category} />
        ))
      ) : (
        !loading && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Categories Found</Text>
            <Text style={styles.emptyText}>Leave categories are currently unavailable.</Text>
          </View>
        )
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    backgroundColor: '#F4F8FD', // Subtle brand-tinted background makes white cards pop
  },
  content: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // Bold, High-Contrast Header Block
  summaryBand: {
    backgroundColor: '#2664b4',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#102a43',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTextWrapper: {
    flex: 1,
  },
  eyebrow: {
    color: '#FCE3C1',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  summaryLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  countBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    minWidth: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  summaryValue: {
    color: '#f08c3c',
    fontSize: 26,
    fontWeight: '900',
  },
  stateCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 12,
    borderWidth: 1.5,
    marginTop: 16,
    padding: 24,
  },
  stateText: {
    color: '#113A70',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 12,
  },
  errorCard: {
    backgroundColor: '#fff1f0',
    borderColor: '#fca5a5',
    borderRadius: 12,
    borderWidth: 2,
    marginTop: 16,
    padding: 16,
  },
  errorTitle: {
    color: '#b42318',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#113A70',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 12,
    marginTop: 24,
  },
  // High Impact Card Framework
  categoryCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 14,
    flexDirection: 'row',
    overflow: 'hidden', // Ensures edge accents match border radius
    shadowColor: '#102a43',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardAccent: {
    width: 6,
  },
  accentActive: {
    backgroundColor: '#f08c3c',
  },
  accentInactive: {
    backgroundColor: '#94a3b8',
  },
  cardMainBody: {
    flex: 1,
    padding: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  categoryName: {
    color: '#113A70',
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 22,
  },
  categoryMeta: {
    color: '#6B7F99',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  // Vibrant Highlighted Status Badges
  statusPill: {
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusActive: {
    backgroundColor: '#2664b4',
  },
  statusInactive: {
    backgroundColor: '#6B7F99',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  cardDivider: {
    height: 1.5,
    backgroundColor: '#EAF2FF',
    marginVertical: 14,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  infoCell: {
    flex: 1,
  },
  infoLabel: {
    color: '#2664b4',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  daysBadge: {
    backgroundColor: '#FFF1E5',
    borderColor: '#f08c3c',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  daysText: {
    color: '#f08c3c',
    fontSize: 14,
    fontWeight: '900',
  },
  infoValue: {
    color: '#101828',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderColor: '#D2E1F4',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    color: '#113A70',
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: '#6B7F99',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default Categories;