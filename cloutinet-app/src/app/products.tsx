import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Switch,
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
  danger: '#F87171',
  success: '#22C55E',
};

type Session = {
  accessToken: string;
  userId: string;
  email: string;
};

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | string | null;
  currency: string | null;
  image_url: string | null;
  is_published: boolean;
};

const EMPTY_DRAFT = {
  name: '',
  description: '',
  price: '',
  image_url: '',
};

function authHeaders(session: Session, extra?: Record<string, string>) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: 'Bearer ' + session.accessToken,
    ...extra,
  };
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboardType?: 'default' | 'decimal-pad';
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ color: COLORS.muted, fontSize: 13, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={multiline}
        placeholderTextColor={COLORS.muted}
        style={{
          backgroundColor: COLORS.bg,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 10,
          color: COLORS.text,
          fontSize: 15,
          paddingHorizontal: 12,
          paddingVertical: 10,
          minHeight: multiline ? 70 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

function ProductCard({
  product,
  session,
  onChanged,
}: {
  product: Product;
  session: Session;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePublished = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/products?id=eq.' + product.id,
        {
          method: 'PATCH',
          headers: authHeaders(session, {
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          }),
          body: JSON.stringify({ is_published: !product.is_published }),
        }
      );
      if (!res.ok) throw new Error('status ' + res.status);
      onChanged();
    } catch {
      setError("Couldn't update. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/products?id=eq.' + product.id,
        {
          method: 'DELETE',
          headers: authHeaders(session),
        }
      );
      if (!res.ok) throw new Error('status ' + res.status);
      onChanged();
    } catch {
      setError("Couldn't delete. Try again.");
      setBusy(false);
    }
  };

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
        {product.image_url ? (
          <Image
            source={{ uri: product.image_url }}
            style={{
              width: 60,
              height: 60,
              borderRadius: 10,
              backgroundColor: COLORS.border,
            }}
          />
        ) : (
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 10,
              backgroundColor: COLORS.border,
            }}
          />
        )}
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            numberOfLines={1}
            style={{ color: COLORS.text, fontSize: 15, fontWeight: '700' }}
          >
            {product.name}
          </Text>
          {product.price != null && product.price !== '' && (
            <Text style={{ color: COLORS.accent, fontSize: 14, marginTop: 2 }}>
              ₦{product.price}
            </Text>
          )}
        </View>
        <View style={{ alignItems: 'center' }}>
          <Switch
            value={product.is_published}
            onValueChange={togglePublished}
            disabled={busy}
            trackColor={{ true: COLORS.accent, false: COLORS.border }}
          />
          <Text style={{ color: COLORS.muted, fontSize: 10, marginTop: 2 }}>
            {product.is_published ? 'Live' : 'Hidden'}
          </Text>
        </View>
      </View>

      {!!error && (
        <Text style={{ color: COLORS.danger, fontSize: 12, marginTop: 8 }}>
          {error}
        </Text>
      )}

      <Pressable
        onPress={remove}
        disabled={busy}
        style={{ marginTop: 10, alignSelf: 'flex-start' }}
      >
        <Text style={{ color: COLORS.danger, fontSize: 13, fontWeight: '600' }}>
          Delete product
        </Text>
      </Pressable>
    </View>
  );
}

function AddProductForm({
  session,
  onAdded,
}: {
  session: Session;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof typeof EMPTY_DRAFT) => (val: string) =>
    setDraft((d) => ({ ...d, [key]: val }));

  const save = async () => {
    if (!draft.name.trim()) {
      setError('Give the product a name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const priceNumber = draft.price.trim()
        ? Number(draft.price.trim())
        : null;
      const res = await fetch(SUPABASE_URL + '/rest/v1/products', {
        method: 'POST',
        headers: authHeaders(session, {
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        }),
        body: JSON.stringify({
          user_id: session.userId,
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          price: isNaN(priceNumber as number) ? null : priceNumber,
          currency: 'NGN',
          image_url: draft.image_url.trim() || null,
          is_published: true,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'status ' + res.status);
      }
      setDraft(EMPTY_DRAFT);
      setOpen(false);
      onAdded();
    } catch (e: any) {
      setError(e.message || "Couldn't add product. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          backgroundColor: COLORS.accent,
          borderRadius: 12,
          paddingVertical: 14,
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
          + Add product
        </Text>
      </Pressable>
    );
  }

  return (
    <View
      style={{
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
        padding: 14,
        marginBottom: 20,
      }}
    >
      <Field label="Product name" value={draft.name} onChangeText={set('name')} />
      <Field
        label="Description"
        value={draft.description}
        onChangeText={set('description')}
        multiline
      />
      <Field
        label="Price in Naira (optional)"
        value={draft.price}
        onChangeText={set('price')}
        keyboardType="decimal-pad"
      />
      <Field
        label="Image URL (optional)"
        value={draft.image_url}
        onChangeText={set('image_url')}
      />

      {!!error && (
        <Text
          style={{ color: COLORS.danger, fontSize: 13, marginBottom: 10 }}
        >
          {error}
        </Text>
      )}

      <View style={{ flexDirection: 'row' }}>
        <Pressable
          onPress={save}
          disabled={saving}
          style={{
            flex: 1,
            backgroundColor: COLORS.accent,
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: 'center',
            marginRight: 8,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>
              Save
            </Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => {
            setOpen(false);
            setError(null);
          }}
          style={{
            borderRadius: 10,
            borderWidth: 1,
            borderColor: COLORS.border,
            paddingVertical: 12,
            paddingHorizontal: 18,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: '600', fontSize: 14 }}>
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setCheckingSession(false);
  }, []);

  const loadProducts = useCallback(
    async (isRefresh: boolean, s: Session) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(
          SUPABASE_URL +
            '/rest/v1/products?select=id,name,description,price,currency,image_url,is_published&user_id=eq.' +
            s.userId +
            '&order=created_at.desc',
          { headers: authHeaders(s, { Accept: 'application/json' }) }
        );
        if (!res.ok) throw new Error('status ' + res.status);
        const data = (await res.json()) as Product[];
        setProducts(data);
      } catch {
        setLoadError("Couldn't load your products.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (session) loadProducts(false, session);
  }, [session, loadProducts]);

  if (checkingSession) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: COLORS.bg,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  if (!session) {
    const login = async () => {
      const trimmedEmail = email.trim();
      if (!trimmedEmail || !password) {
        setLoginError('Enter both your email and password.');
        return;
      }
      setLoggingIn(true);
      setLoginError(null);
      try {
        const res = await fetch(
          SUPABASE_URL + '/auth/v1/token?grant_type=password',
          {
            method: 'POST',
            headers: {
              apikey: SUPABASE_KEY,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: trimmedEmail, password }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(
            data.error_description || data.msg || 'Login failed.'
          );
        }
        setSession({
          accessToken: data.access_token,
          userId: data.user.id,
          email: data.user.email,
        });
      } catch (e: any) {
        setLoginError(e.message || 'Something went wrong. Try again.');
      } finally {
        setLoggingIn(false);
      }
    };

    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: COLORS.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 40,
            paddingHorizontal: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '800' }}>
            Manage products
          </Text>
          <Text
            style={{
              color: COLORS.muted,
              fontSize: 15,
              marginTop: 6,
              marginBottom: 24,
              lineHeight: 21,
            }}
          >
            Log in to add and manage your products.
          </Text>
          <Field label="Email" value={email} onChangeText={setEmail} />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
          />
          {!!loginError && (
            <Text
              style={{ color: COLORS.danger, fontSize: 14, marginBottom: 14 }}
            >
              {loginError}
            </Text>
          )}
          <Pressable
            onPress={login}
            disabled={loggingIn}
            style={{
              backgroundColor: COLORS.accent,
              borderRadius: 12,
              paddingVertical: 15,
              alignItems: 'center',
              opacity: loggingIn ? 0.7 : 1,
            }}
          >
            {loggingIn ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}
              >
                Log in
              </Text>
            )}
          </Pressable>
          <Text
            style={{
              color: COLORS.muted,
              fontSize: 13,
              marginTop: 16,
              lineHeight: 19,
            }}
          >
            New here? Sign up from the Account tab first.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: COLORS.bg, paddingTop: insets.top }}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProducts(true, session)}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
      >
        <Text
          style={{
            color: COLORS.text,
            fontSize: 24,
            fontWeight: '800',
            marginTop: 24,
            marginBottom: 20,
          }}
        >
          My Products
        </Text>

        <AddProductForm
          session={session}
          onAdded={() => loadProducts(false, session)}
        />

        {loading ? (
          <ActivityIndicator color={COLORS.accent} />
        ) : loadError ? (
          <Text style={{ color: COLORS.muted, fontSize: 14 }}>
            {loadError}
          </Text>
        ) : products.length === 0 ? (
          <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20 }}>
            No products yet. Add your first one above.
          </Text>
        ) : (
          products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              session={session}
              onChanged={() => loadProducts(false, session)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
