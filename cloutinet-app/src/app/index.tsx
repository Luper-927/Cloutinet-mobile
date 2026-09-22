import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  FlatList,
  Image,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SUPABASE_URL = 'https://ujtsoawkedgsfkjkpfzj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_GPtM81kHTAz_2uzmANRx9Q_5qKW7KUH';

const COLORS = {
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  text: '#F1F5F9',
  muted: '#94A3B8',
  accent: '#3B82F6',
  whatsapp: '#16A34A',
};

type Business = {
  id: string;
  business_name: string | null;
  business_slug: string | null;
  business_category: string | null;
  phone: string | null;
  location: string | null;
  tagline: string | null;
  logo_url: string | null;
  business_hours: string | null;
  services: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | string | null;
  currency: string | null;
  image_url: string | null;
};

const LIST_PATH =
  'profiles' +
  '?select=id,business_name,business_slug,business_category,phone,location,tagline,logo_url,business_hours,services,facebook_url,instagram_url,youtube_url,tiktok_url' +
  '&business_name=not.is.null' +
  '&order=created_at.desc' +
  '&limit=200';

async function restGet<T>(path: string): Promise<T> {
  const res = await fetch(SUPABASE_URL + '/rest/v1/' + path, {
    headers: { apikey: SUPABASE_KEY, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error('Request failed with status ' + res.status);
  }
  return (await res.json()) as T;
}

function toInternationalNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('234')) return digits;
  if (digits.startsWith('0')) return '234' + digits.slice(1);
  if (digits.length === 10) return '234' + digits;
  return digits;
}

function whatsappLink(phone: string, text?: string): string {
  const base = 'https://wa.me/' + toInternationalNumber(phone);
  return text ? base + '?text=' + encodeURIComponent(text) : base;
}

function openLink(url: string) {
  Linking.openURL(url).catch(() => {});
}

function normalizeUrl(u: string): string {
  const t = u.trim();
  return /^https?:\/\//i.test(t) ? t : 'https://' + t;
}

function formatPrice(
  price: number | string | null,
  currency: string | null
): string {
  if (price === null || price === undefined || price === '') return '';
  const n = Number(price);
  if (isNaN(n) || n === 0) return '';
  const parts = n.toFixed(n % 1 === 0 ? 0 : 2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const symbol = !currency || currency === 'NGN' ? '₦' : currency + ' ';
  return symbol + parts.join('.');
}

function Logo({
  uri,
  name,
  size,
}: {
  uri: string | null;
  name: string;
  size: number;
}) {
  const [failed, setFailed] = useState(false);
  const initial = name ? name.charAt(0).toUpperCase() : '?';
  if (uri && !failed) {
    return (
      <Image
        source={{ uri }}
        onError={() => setFailed(true)}
        style={{
          width: size,
          height: size,
          borderRadius: size / 4,
          backgroundColor: COLORS.border,
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 4,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{ color: '#FFFFFF', fontSize: size * 0.42, fontWeight: '700' }}
      >
        {initial}
      </Text>
    </View>
  );
}

function BusinessCard({
  item,
  onOpen,
}: {
  item: Business;
  onOpen: (b: Business) => void;
}) {
  const name = (item.business_name || '').trim();
  const phone = (item.phone || '').trim();

  return (
    <Pressable
      onPress={() => onOpen(item)}
      style={({ pressed }) => ({
        backgroundColor: COLORS.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        marginBottom: 12,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Logo uri={item.logo_url} name={name} size={52} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            numberOfLines={1}
            style={{ color: COLORS.text, fontSize: 17, fontWeight: '700' }}
          >
            {name}
          </Text>
          {!!item.business_category && (
            <Text
              numberOfLines={1}
              style={{ color: COLORS.accent, fontSize: 13, marginTop: 2 }}
            >
              {item.business_category}
            </Text>
          )}
          {!!item.location && (
            <Text
              numberOfLines={1}
              style={{ color: COLORS.muted, fontSize: 13, marginTop: 2 }}
            >
              {item.location}
            </Text>
          )}
        </View>
      </View>

      {!!item.tagline && (
        <Text
          numberOfLines={2}
          style={{
            color: COLORS.muted,
            fontSize: 14,
            lineHeight: 20,
            marginTop: 12,
          }}
        >
          {item.tagline}
        </Text>
      )}

      <Text
        style={{
          color: COLORS.accent,
          fontSize: 13,
          fontWeight: '600',
          marginTop: 12,
        }}
      >
        View details and products
      </Text>

      {!!phone && (
        <View style={{ flexDirection: 'row', marginTop: 12 }}>
          <Pressable
            onPress={() => openLink(whatsappLink(phone))}
            style={{
              flex: 1,
              backgroundColor: COLORS.whatsapp,
              borderRadius: 10,
              paddingVertical: 11,
              alignItems: 'center',
              marginRight: 8,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
              Message on WhatsApp
            </Text>
          </Pressable>
          <Pressable
            onPress={() => openLink('tel:+' + toInternationalNumber(phone))}
            style={{
              borderRadius: 10,
              borderWidth: 1,
              borderColor: COLORS.border,
              paddingVertical: 11,
              paddingHorizontal: 18,
              alignItems: 'center',
            }}
          >
            <Text
              style={{ color: COLORS.text, fontWeight: '600', fontSize: 14 }}
            >
              Call
            </Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      style={{
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '700',
        marginTop: 28,
        marginBottom: 12,
      }}
    >
      {children}
    </Text>
  );
}

function ProductRow({
  product,
  phone,
  businessName,
}: {
  product: Product;
  phone: string;
  businessName: string;
}) {
  const price = formatPrice(product.price, product.currency);
  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row' }}>
        <Logo uri={product.image_url} name={product.name} size={68} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            numberOfLines={2}
            style={{ color: COLORS.text, fontSize: 16, fontWeight: '700' }}
          >
            {product.name}
          </Text>
          {!!price && (
            <Text
              style={{
                color: COLORS.accent,
                fontSize: 15,
                fontWeight: '700',
                marginTop: 3,
              }}
            >
              {price}
            </Text>
          )}
          {!!product.description && (
            <Text
              numberOfLines={2}
              style={{
                color: COLORS.muted,
                fontSize: 13,
                lineHeight: 18,
                marginTop: 4,
              }}
            >
              {product.description}
            </Text>
          )}
        </View>
      </View>
      {!!phone && (
        <Pressable
          onPress={() =>
            openLink(
              whatsappLink(
                phone,
                'Hello ' +
                  businessName +
                  ', I saw "' +
                  product.name +
                  '" on Cloutinet. Is it available?'
              )
            )
          }
          style={{
            marginTop: 12,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: COLORS.whatsapp,
            paddingVertical: 10,
            alignItems: 'center',
          }}
        >
          <Text
            style={{ color: COLORS.whatsapp, fontWeight: '700', fontSize: 14 }}
          >
            Ask about this on WhatsApp
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function BusinessDetail({
  business,
  onBack,
}: {
  business: Business;
  onBack: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsFailed, setProductsFailed] = useState(false);

  const name = (business.business_name || '').trim();
  const phone = (business.phone || '').trim();
  const hours = (business.business_hours || '').trim();
  const services = (business.services || '')
    .split(/,|\n/)
    .map((s) => s.trim())
    .filter((s) => s !== '');
  const socials = [
    { label: 'Facebook', url: business.facebook_url },
    { label: 'Instagram', url: business.instagram_url },
    { label: 'YouTube', url: business.youtube_url },
    { label: 'TikTok', url: business.tiktok_url },
  ].filter((s) => s.url && s.url.trim() !== '');

  useEffect(() => {
    let cancelled = false;
    setLoadingProducts(true);
    setProductsFailed(false);
    restGet<Product[]>(
      'products?select=id,name,description,price,currency,image_url' +
        '&user_id=eq.' +
        business.id +
        '&is_published=eq.true&order=created_at.desc&limit=100'
    )
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setProductsFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoadingProducts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [business.id]);

  return (
    <View
      style={{ flex: 1, backgroundColor: COLORS.bg, paddingTop: insets.top }}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={{ color: COLORS.accent, fontSize: 16, fontWeight: '600' }}>
            Back to businesses
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
          <Logo uri={business.logo_url} name={name} size={76} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '800' }}>
              {name}
            </Text>
            {!!business.business_category && (
              <Text style={{ color: COLORS.accent, fontSize: 14, marginTop: 4 }}>
                {business.business_category}
              </Text>
            )}
            {!!business.location && (
              <Text style={{ color: COLORS.muted, fontSize: 14, marginTop: 2 }}>
                {business.location}
              </Text>
            )}
          </View>
        </View>

        {!!business.tagline && (
          <Text
            style={{
              color: COLORS.muted,
              fontSize: 15,
              lineHeight: 22,
              marginTop: 18,
            }}
          >
            {business.tagline}
          </Text>
        )}

        {!!phone && (
          <View style={{ flexDirection: 'row', marginTop: 20 }}>
            <Pressable
              onPress={() => openLink(whatsappLink(phone))}
              style={{
                flex: 1,
                backgroundColor: COLORS.whatsapp,
                borderRadius: 12,
                paddingVertical: 14,
                alignItems: 'center',
                marginRight: 8,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                Message on WhatsApp
              </Text>
            </Pressable>
            <Pressable
              onPress={() => openLink('tel:+' + toInternationalNumber(phone))}
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: COLORS.border,
                paddingVertical: 14,
                paddingHorizontal: 22,
                alignItems: 'center',
              }}
            >
              <Text
                style={{ color: COLORS.text, fontWeight: '600', fontSize: 15 }}
              >
                Call
              </Text>
            </Pressable>
          </View>
        )}

        {!!hours && (
          <View>
            <SectionTitle>Opening hours</SectionTitle>
            <Text style={{ color: COLORS.muted, fontSize: 15, lineHeight: 22 }}>
              {hours}
            </Text>
          </View>
        )}

        {services.length > 0 && (
          <View>
            <SectionTitle>Services</SectionTitle>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {services.map((s, i) => (
                <View
                  key={s + i}
                  style={{
                    backgroundColor: COLORS.card,
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text style={{ color: COLORS.text, fontSize: 13 }}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {socials.length > 0 && (
          <View>
            <SectionTitle>Find them online</SectionTitle>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {socials.map((s) => (
                <Pressable
                  key={s.label}
                  onPress={() => openLink(normalizeUrl(s.url as string))}
                  style={{
                    borderWidth: 1,
                    borderColor: COLORS.border,
                    borderRadius: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    marginRight: 8,
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      color: COLORS.text,
                      fontSize: 14,
                      fontWeight: '600',
                    }}
                  >
                    {s.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <SectionTitle>Products</SectionTitle>
        {loadingProducts ? (
          <ActivityIndicator color={COLORS.accent} style={{ marginTop: 8 }} />
        ) : productsFailed ? (
          <Text style={{ color: COLORS.muted, fontSize: 15, lineHeight: 22 }}>
            Couldn't load products. Go back and open this business again.
          </Text>
        ) : products.length === 0 ? (
          <Text style={{ color: COLORS.muted, fontSize: 15, lineHeight: 22 }}>
            This business hasn't added any products yet.
          </Text>
        ) : (
          products.map((p) => (
            <ProductRow
              key={p.id}
              product={p}
              phone={phone}
              businessName={name}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<Business | null>(null);

  const load = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await restGet<Business[]>(LIST_PATH);
      setBusinesses(
        data.filter((b) => b.business_name && b.business_name.trim() !== '')
      );
    } catch (e) {
      setError(
        "Couldn't load businesses. Check your internet connection and try again."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    if (!selected) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelected(null);
      return true;
    });
    return () => sub.remove();
  }, [selected]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    businesses.forEach((b) => {
      const c = (b.business_category || '').trim();
      if (c) set.add(c);
    });
    return ['All', ...Array.from(set).sort()];
  }, [businesses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return businesses.filter((b) => {
      if (category !== 'All' && (b.business_category || '').trim() !== category) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        b.business_name,
        b.business_category,
        b.location,
        b.tagline,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [businesses, query, category]);

  if (selected) {
    return (
      <BusinessDetail business={selected} onBack={() => setSelected(null)} />
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: COLORS.bg, paddingTop: insets.top }}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Text style={{ color: COLORS.text, fontSize: 28, fontWeight: '800' }}>
          Cloutinet
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 15, marginTop: 4 }}>
          Find businesses and contact them directly.
        </Text>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, category or location"
          placeholderTextColor={COLORS.muted}
          autoCorrect={false}
          style={{
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 12,
            color: COLORS.text,
            fontSize: 15,
            paddingHorizontal: 14,
            paddingVertical: 12,
            marginTop: 16,
          }}
        />
      </View>

      <View style={{ height: 52, marginTop: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            alignItems: 'center',
          }}
        >
          {categories.map((c) => {
            const active = c === category;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={{
                  backgroundColor: active ? COLORS.accent : COLORS.card,
                  borderWidth: 1,
                  borderColor: active ? COLORS.accent : COLORS.border,
                  borderRadius: 20,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    color: active ? '#FFFFFF' : COLORS.muted,
                    fontSize: 14,
                    fontWeight: active ? '700' : '500',
                  }}
                >
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={{ color: COLORS.muted, marginTop: 12, fontSize: 14 }}>
            Loading businesses
          </Text>
        </View>
      ) : error ? (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              color: COLORS.text,
              fontSize: 16,
              textAlign: 'center',
              lineHeight: 22,
            }}
          >
            {error}
          </Text>
          <Pressable
            onPress={() => load(false)}
            style={{
              backgroundColor: COLORS.accent,
              borderRadius: 10,
              paddingVertical: 12,
              paddingHorizontal: 24,
              marginTop: 16,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
              Try again
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <BusinessCard item={item} onOpen={setSelected} />
          )}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 4,
            paddingBottom: 32,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={COLORS.accent}
              colors={[COLORS.accent]}
            />
          }
          ListHeaderComponent={
            <Text
              style={{ color: COLORS.muted, fontSize: 13, marginBottom: 10 }}
            >
              {filtered.length === 1
                ? '1 business'
                : filtered.length + ' businesses'}
            </Text>
          }
          ListEmptyComponent={
            <Text
              style={{
                color: COLORS.muted,
                fontSize: 15,
                lineHeight: 22,
                textAlign: 'center',
                marginTop: 40,
              }}
            >
              No businesses match your search. Try a different word or choose
              All.
            </Text>
          }
        />
      )}
    </View>
  );
}
