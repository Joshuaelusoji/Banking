
import { quickActions } from "@/constants/quickActions";

const QuickActions = () => {
    return (
        <div className="flex flex-wrap gap-2">
            {quickActions.map((item) => {
                const Icon = item.icon;

                return (
                    <button
                        key={item.id}
                        type="button"
                        className="flex items-center gap-1 rounded-xl px-1 py-1 text-xs font-regular"
                        style={{
                            color: item.color,
                        }}
                    >
                        <Icon size={12} />
                        <span style={{ textShadow: "1px 1px 2px rgba(0, 0, 0, 0.3)" }}>
                            {item.name}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default QuickActions;
