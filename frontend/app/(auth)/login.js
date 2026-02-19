import React, { useEffect, useState } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    useColorScheme,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import auth from '@react-native-firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? 'dark' : 'light';
    const colors = Colors[theme];
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [isGuestLoading, setIsGuestLoading] = useState(false);
    const { login, loginAsGuest } = useAuth();

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        });
    }, []);

    const handleGoogleSignIn = async () => {
        if (isGoogleLoading || isGuestLoading) return;

        setIsGoogleLoading(true);
        try {
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
            const userInfo = await GoogleSignin.signIn();
            console.log('User Info from Google Sign In:', userInfo);
            if (!userInfo.data || !userInfo.data.idToken) {
              Alert.alert('Login Error', 'Google Sign-In failed to return an ID token. Please check your app configuration.');
              setIsGoogleLoading(false);
              return;
            }
            const googleCredential = auth.GoogleAuthProvider.credential(userInfo.data.idToken);
            await auth().signInWithCredential(googleCredential);
            
            router.replace('/(tabs)/dashboard');

        } catch (error) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // user cancelled the login flow
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // operation (e.g. sign in) is in progress already
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                Alert.alert('Error', 'Google Play Services not available');
            } else {
                console.error('Google Sign-In Error', error);
                Alert.alert('Error', 'Failed to sign in with Google');
            }
        } finally {
            setIsGoogleLoading(false);
        }
    };

    const handleGuestAccess = async () => {
        if (isGoogleLoading || isGuestLoading) return;
        setIsGuestLoading(true);
        try {
            await loginAsGuest();
            router.replace('/(tabs)/dashboard');
        } catch (error) {
            Alert.alert('Error', 'Failed to continue as guest.');
        } finally {
            setIsGuestLoading(false);
        }
    };

    const handleSignUp = () => {
        console.log('Continue as Guest Pressed');
        router.push('/(auth)/signup');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />

            {/* 1. Brand Section */}
            <View style={styles.headerSection}>
                {/* Fallback for missing surfaceElevated: use background with border or just background */}
                <View style={[styles.logoContainer, { backgroundColor: colors.background, borderColor: colors.tabIconDefault, borderWidth: 1 }]}>
                    <Ionicons name="flash" size={48} color={colors.tint} />
                </View>

                <Text style={[styles.brandTitle, { color: colors.text }]}>
                    Fetherstill
                </Text>
                <Text style={[styles.brandSubtitle, { color: colors.tabIconDefault }]}>
                    BMS Monitor
                </Text>
            </View>

            {/* 2. Actions Section */}
            <View style={styles.actionSection}>
                {/* Google Sign-In Button */}
                <TouchableOpacity
                    style={[
                        styles.googleButton,
                        {
                            backgroundColor: colors.background, // fallback from card
                            borderColor: colors.tabIconDefault // fallback from cardBorder
                        }
                    ]}
                    onPress={handleGoogleSignIn}
                    activeOpacity={0.8}
                >
                    {isGoogleLoading ? (
                        <ActivityIndicator size="small" color={colors.text} style={styles.btnIcon} />
                    ) : (
                        <Ionicons name="logo-google" size={20} color={colors.text} style={styles.btnIcon} />
                    )}
                    <Text style={[styles.googleButtonText, { color: colors.text }]}>
                        {isGoogleLoading ? 'Signing in...' : 'Sign in with Google'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        // styles.signupButton,
                        {
                            borderColor: colors.tint,
                        }
                    ]}
                    onPress={handleSignUp}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.signupButtonText, { color: colors.tint }]}>
                        or
                    </Text>
                </TouchableOpacity>

                {/* Guest Access Button */}
                <TouchableOpacity
                    style={styles.guestButton}
                    onPress={handleGuestAccess}
                    activeOpacity={0.6}
                >
                    {isGuestLoading ? (
                        <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                        <Text style={[styles.guestButtonText, { color: colors.tint }]}>
                            Continue as Guest
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.versionText, { color: colors.tabIconDefault }]}>
                    v1.0.0
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
    },
    headerSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 60,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    brandTitle: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    brandSubtitle: {
        fontSize: 16,
        fontWeight: '500',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    actionSection: {
        paddingHorizontal: 24,
        paddingBottom: 40,
        width: '100%',
        alignItems: 'center',
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: 56,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    btnIcon: {
        marginRight: 12,
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    guestButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    guestButtonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    footer: {
        alignItems: 'center',
        paddingBottom: 24,
    },
    versionText: {
        fontSize: 12,
    },
    signupButton: {
        width: '100%',
        height: 56,
        borderRadius: 12,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    signupButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },

});


