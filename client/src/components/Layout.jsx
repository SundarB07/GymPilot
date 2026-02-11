import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-background text-text">
            <Navbar />
            <main className="p-6 container mx-auto">
                {children}
            </main>
        </div>
    );
};

export default Layout;
