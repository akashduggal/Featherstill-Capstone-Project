import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    useColorScheme,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { Colors } from '../../constants/Colors';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const theme = colorScheme === 'dark' ? 'dark' : 'light';
    const colors = Colors[theme];

    const handleGoogleSignIn = () => {
        console.log('Google Sign-In Pressed');
        router.replace('/(tabs)/home');
    };

    const handleGuestAccess = () => {
        console.log('Continue as Guest Pressed');
        router.replace('/(tabs)/home');
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
                    <Ionicons name="logo-google" size={20} color={colors.text} style={styles.btnIcon} />
                    <Text style={[styles.googleButtonText, { color: colors.text }]}>
                        Sign in with Google
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.signupButton,
                        {
                            borderColor: colors.tint,
                        }
                    ]}
                    onPress={handleSignUp}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.signupButtonText, { color: colors.tint }]}>
                        Create an account
                    </Text>
                </TouchableOpacity>

                {/* Guest Access Button */}
                <TouchableOpacity
                    style={styles.guestButton}
                    onPress={handleGuestAccess}
                    activeOpacity={0.6}
                >
                    <Text style={[styles.guestButtonText, { color: colors.tint }]}>
                        Continue as Guest
                    </Text>
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


