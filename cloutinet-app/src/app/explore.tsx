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
};

type Session = {
  accessToken: string;
  userId: string;
  email: string;
};

type Profile = {
  business_name: string | null;
  business_category: string | null;
  phone: string | null;
  location: string | null;
};

function Field({
  label,
  value,
  onChangeText,
  secure,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad';
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
        }}
      />
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(
      SUPABASE_URL +
        '/rest/v1/profiles?select=business_name,business_category,phone,location&id=eq.' +
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
        if (!cancelled) setProfile(data[0] || null);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your business profile.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session.userId, session.accessToken]);

  return (
    <View
      style={{ flex: 1, backgroundColor: COLORS.bg, paddingTop: insets.top }}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
        <Text style={{ color: COLORS.text, fontSize: 24, fontWeight: '800' }}>
          My Account
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 14, marginTop: 4 }}>
          {session.email}
        </Text>

        <View
          style={{
            backgroundColor: COLORS.card,
            borderWidth: 1,
            borderColor: COLORS.border,
            borderRadius: 14,
            padding: 16,
            marginTop: 24,
          }}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.accent} />
          ) : error ? (
            <Text style={{ color: COLORS.muted, fontSize: 14 }}>{error}</Text>
          ) : profile && profile.business_name ? (
            <View>
              <Text
                style={{ color: COLORS.text, fontSize: 18, fontWeight: '700' }}
              >
                {profile.business_name}
              </Text>
              {!!profile.business_category && (
                <Text
                  style={{ color: COLORS.accent, fontSize: 14, marginTop: 4 }}
                >
                  {profile.business_category}
                </Text>
              )}
              {!!profile.location && (
                <Text
                  style={{ color: COLORS.muted, fontSize: 14, marginTop: 4 }}
                >
                  {profile.location}
                </Text>
              )}
            </View>
          ) : (
            <Text style={{ color: COLORS.muted, fontSize: 14, lineHeight: 20 }}>
              No business profile found on this account yet. Set one up on
              the Cloutinet website for now.
            </Text>
          )}
        </View>

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
      </View>
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
