import { TextInput, useColorScheme } from 'react-native'
import { Colors } from '../Constants/Colors'

const ThemedTextInput = ({ style, ...props }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light

    return (
        <TextInput
            placeholderTextColor={theme.muted}
            style={[
                {
                    backgroundColor: theme.uiBackground,
                    borderColor: theme.cardBorder,
                    borderWidth: 1,
                    color: theme.text,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderRadius: 6,
                    fontSize: 16,
                },
                style,
            ]}
            {...props}
        />
    )
}

export default ThemedTextInput
