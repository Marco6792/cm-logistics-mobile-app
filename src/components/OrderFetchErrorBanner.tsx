import React from 'react';
import { Button, Text, XStack, YStack, useTheme } from 'tamagui';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

interface OrderFetchErrorBannerProps {
    errors: Record<string, string | null>;
    onRetry: () => void;
}

/**
 * Surfaces order-fetch failures (e.g. unreachable Fleetbase host) instead of
 * silently rendering zero orders. Shows the first error message and offers a
 * retry button that re-runs the failed order queries.
 */
const OrderFetchErrorBanner: React.FC<OrderFetchErrorBannerProps> = ({ errors, onRetry }) => {
    const theme = useTheme();
    const messages = Object.values(errors ?? {}).filter(Boolean) as string[];

    if (!messages.length) {
        return null;
    }

    const primaryMessage = messages[0];

    return (
        <YStack bg='$error' borderBottomWidth={1} borderColor='$errorBorder' px='$4' py='$3'>
            <XStack space='$3' alignItems='center'>
                <FontAwesomeIcon icon={faTriangleExclamation} color={theme['$errorText'].val} size={20} />
                <YStack flex={1} space='$1'>
                    <Text color='$errorText' fontWeight='bold' fontSize='$5'>
                        Unable to load orders
                    </Text>
                    <Text color='$errorText' fontSize='$4' numberOfLines={2}>
                        {primaryMessage}
                    </Text>
                </YStack>
                <Button bg='$error' borderWidth={1} borderColor='$errorBorder' px='$4' py='$1' onPress={onRetry} pressStyle={{ opacity: 0.7 }}>
                    <Button.Text color='$errorText' fontWeight='bold'>
                        Retry
                    </Button.Text>
                </Button>
            </XStack>
        </YStack>
    );
};

export default OrderFetchErrorBanner;
