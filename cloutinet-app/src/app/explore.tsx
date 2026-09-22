import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  danger: '#F87171',
  success: '#22C55E',
};

export type Session = {
  accessToken: string;
  userId: string;
  email: string;
};

type Profile = {
  business_name: string | null;
  business_category: string | null;
  phone: string | null;
  location: string | null;
  tagline: string | null;
  business_hours: string | null;
  services: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
};

const EMPTY_PROFILE: Profile = {
  business_name: '',
  business_category: '',
  phone: '',
  location: '',
  tagline: '',
  business_hours: '',
  services: '',
  facebook_url: '',
  instagram_url: '',
};

function Field({
  label,
  value,
  onChangeText,
  secure,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ color: COLORS.muted, fontSize: 13, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboardType || 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        multiline={multiline}
        placeholderTextColor={COLORS.muted}
        style={{
          backgroundColor: COLORS.card,
          borderWidth: 1,
          borderColor: COLORS.border,
          borderRadius: 12,
          color: COLORS.text,
          fontSize: 15,
          paddingHorizontal: 14,
          paddingVertical: 12,
          minHeight: multiline ? 90 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}

function EditProfileForm({ session }: { session: Session }) {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch(
      SUPABASE_URL +
        '/rest/v1/profiles?select=business_name,business_category,phone,location,tagline,business_hours,services,facebook_url,instagram_url&id=eq.' +
        session.userId,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: 'Bearer ' + session.accessToken,
          Accept: 'application/json',
        },
      }
    )
      .then((res) => {
        if (!res.ok) throw new Error('status ' + res.status);
        return res.json();
      })
      .then((data: Profile[]) => {
        if (cancelled) return;
        if (data[0]) {
          const p = data[0];
          setProfile({
            business_name: p.business_name || '',
            business_category: p.business_category || '',
            phone: p.phone || '',
            location: p.location || '',
            tagline: p.tagline || '',
            business_hours: p.business_hours || '',
            services: p.services || '',
            facebook_url: p.facebook_url || '',
            instagram_url: p.instagram_url || '',
          });
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load your business profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session.userId, session.accessToken]);

  const set = (key: keyof Profile) => (val: string) =>
    setProfile((p) => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    try {
      const res = await fetch(
        SUPABASE_URL + '/rest/v1/profiles?id=eq.' + session.userId,
        {
          method: 'PATCH',
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: 'Bearer ' + session.accessToken,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify(profile),
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Save failed with status ' + res.status);
      }
      setSaved(true);
    } catch (e: any) {
      setSaveError(e.message || 'Something went wrong. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ paddingTop: 40, alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.accent} />
      </View>
    );
  }

  if (loadError) {
    return (
      <Text style={{ color: COLORS.muted, fontSize: 14, marginTop: 20 }}>
        {loadError}
      </Text>
    );
  }

  return (
    <View style={{ marginTop: 20 }}>
      <Field
        label="Business name"
        value={profile.business_name || ''}
        onChangeText={set('business_name')}
      />
      <Field
        label="Category"
        value={profile.business_category || ''}
        onChangeText={set('business_category')}
      />
      <Field
        label="Phone (WhatsApp number)"
        value={profile.phone || ''}
        onChangeText={set('phone')}
        keyboardType="phone-pad"
      />
      <Field
        label="Location"
        value={profile.location || ''}
        onChangeText={set('location')}
      />
      <Field
        label="Tagline"
        value={profile.tagline || ''}
        onChangeText={set('tagline')}
        multiline
      />
      <Field
        label="Opening hours"
        value={profile.business_hours || ''}
        onChangeText={set('business_hours')}
        multiline
      />
      <Field
        label="Services (comma separated)"
        value={profile.services || ''}
        onChangeText={set('services')}
        multiline
      />
      <Field
        label="Facebook URL"
        value={profile.facebook_url || ''}
        onChangeText={set('facebook_url')}
      />
      <Field
        label="Instagram URL"
        value={profile.instagram_url || ''}
        onChangeText={set('instagram_url')}
      />

      {!!saveError && (
        <Text
          style={{
            color: COLORS.danger,
            fontSize: 14,
            marginBottom: 12,
            lineHeight: 20,
          }}
        >
          {saveError}
        </Text>
      )}
      {saved && (
        <Text
          style={{
            color: COLORS.success,
            fontSize: 14,
            marginBottom: 12,
          }}
        >
          Saved.
        </Text>
      )}

      <Pressable
        onPress={save}
        disabled={saving}
        style={{
          backgroundColor: COLORS.accent,
          borderRadius: 12,
          paddingVertical: 15,
          alignItems: 'center',
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
            Save changes
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function SignedInView({
  session,
  onLogout,
}: {
  session: Session;
  onLogout: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ flex: 1, backgroundColor: COLORS.bg, paddingTop: insets.top }}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}
      >
        <Text
          style={{
            color: COLORS.text,
            fontSize: 24,
            fontWeight: '800',
            marginTop: 24,
          }}
        >
          My Business
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 14, marginTop: 4 }}>
          {session.email}
        </Text>

        <EditProfileForm session={session} />

        <Pressable
          onPress={onLogout}
          style={{
            marginTop: 24,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: COLORS.danger,
            paddingVertical: 14,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: COLORS.danger, fontWeight: '700', fontSize: 15 }}>
            Log out
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<Session | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  if (session) {
    return (
      <SignedInView session={session} onLogout={() => setSession(null)} />
    );
  }

  const submit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Enter both your email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'login') {
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
      } else {
        const res = await fetch(SUPABASE_URL + '/auth/v1/signup', {
          method: 'POST',
          headers: {
            apikey: SUPABASE_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: trimmedEmail, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error_description || data.msg || 'Sign up failed.');
        }
        if (data.access_token) {
          setSession({
            accessToken: data.access_token,
            userId: data.user.id,
            email: data.user.email,
          });
        } else {
          setNotice('Account created. Check your email to confirm it, then log in.');
          setMode('login');
        }
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
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
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={{ color: COLORS.text, fontSize: 26, fontWeight: '800' }}>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </Text>
        <Text
          style={{
            color: COLORS.muted,
            fontSize: 15,
            marginTop: 6,
            marginBottom: 28,
            lineHeight: 21,
          }}
        >
          {mode === 'login'
            ? 'Log in to manage your Cloutinet business.'
            : 'Sign up with the same email and password you use, or will use, on the Cloutinet website.'}
        </Text>

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secure
        />

        {!!error && (
          <Text
            style={{
              color: COLORS.danger,
              fontSize: 14,
              marginBottom: 14,
              lineHeight: 20,
            }}
          >
            {error}
          </Text>
        )}
        {!!notice && (
          <Text
            style={{
              color: COLORS.accent,
              fontSize: 14,
              marginBottom: 14,
              lineHeight: 20,
            }}
          >
            {notice}
          </Text>
        )}

        <Pressable
          onPress={submit}
          disabled={submitting}
          style={{
            backgroundColor: COLORS.accent,
            borderRadius: 12,
            paddingVertical: 15,
            alignItems: 'center',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
              {mode === 'login' ? 'Log in' : 'Sign up'}
            </Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError(null);
            setNotice(null);
          }}
          style={{ marginTop: 20, alignItems: 'center' }}
        >
          <Text style={{ color: COLORS.muted, fontSize: 14 }}>
            {mode === 'login'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Log in'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
