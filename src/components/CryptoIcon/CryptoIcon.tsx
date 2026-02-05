import './CryptoIcon.css';

interface CryptoIconProps {
    icon: string;
    symbol: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    color?: string;
}

const CryptoIcon = ({ icon, symbol, size = 'md', color }: CryptoIconProps) => {
    // Check if icon is a URL (image) or FontAwesome class
    const isImage = icon.startsWith('http') || icon.startsWith('/');

    if (isImage) {
        return (
            <img
                src={icon}
                alt={symbol}
                className={`crypto-icon-img crypto-icon-${size}`}
            />
        );
    }

    // FontAwesome icon
    return (
        <i
            className={`crypto-icon-fa crypto-icon-${size} ${icon}`}
            style={{ color }}
        ></i>
    );
};

export default CryptoIcon;
