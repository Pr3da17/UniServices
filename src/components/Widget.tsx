import type { LucideIcon } from "lucide-react";

interface WidgetProps {
  title: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export default function Widget({ 
  title, 
  icon: Icon, 
  iconColor = "text-primary", 
  children, 
  className = "",
  headerAction
}: WidgetProps) {
  return (
    <section className={`glass rounded-[2rem] p-6 shadow-main hover:shadow-2xl transition-all duration-500 hover:bg-card-hover group border border-border-main h-full flex flex-col ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          {Icon && (
            <div className={`p-2.5 bg-accent-bg rounded-xl group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
          )}
          <h3 className="text-lg font-bold tracking-tight text-main group-hover:text-primary transition-colors">
            {title}
          </h3>
        </div>
        {headerAction}
      </div>
      
      <div className="flex-1">
        {children}
      </div>
    </section>
  );
}
