import { useState, useEffect, useContext } from 'react';
import Layout from '../components/Layout';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Upload } from 'lucide-react';

const Progress = () => {
    const { user } = useContext(AuthContext);
    const [images, setImages] = useState([]);
    const [weight, setWeight] = useState('');
    const [file, setFile] = useState(null);

    useEffect(() => {
        fetchImages();
    }, []);

    const fetchImages = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const { data } = await axios.get('http://localhost:5000/api/progress', config);
            setImages(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);
        formData.append('weight', weight);

        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${user.token}`,
                    'Content-Type': 'multipart/form-data'
                }
            };
            await axios.post('http://localhost:5000/api/progress', formData, config);
            setWeight('');
            setFile(null);
            fetchImages();
        } catch (error) {
            console.error(error);
            alert('Upload failed');
        }
    };

    return (
        <Layout>
            <div className="max-w-6xl mx-auto">
                <h2 className="text-5xl font-extrabold mb-10 text-center bg-clip-text text-transparent bg-gradient-to-r from-secondary via-purple-500 to-primary drop-shadow-[0_0_15px_rgba(168,85,247,0.5)] tracking-tight">Progress Gallery</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-surface p-6 rounded-xl border border-gray-700 sticky top-6"
                        >
                            <h3 className="text-xl font-bold mb-4 text-white">Upload Check-in</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Current Weight (kg)</label>
                                    <input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="w-full bg-background border border-gray-600 rounded p-3 text-white focus:border-purple-500 focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Photo</label>
                                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center hover:border-purple-500 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            onChange={(e) => setFile(e.target.files[0])}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            accept="image/*"
                                        />
                                        <Upload className="mx-auto text-gray-400 mb-2" />
                                        <span className="text-sm text-gray-400">{file ? file.name : 'Click to upload'}</span>
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white p-3 rounded-lg font-bold">
                                    Save Progress
                                </button>
                            </form>
                        </motion.div>
                    </div>

                    <div className="md:col-span-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {images.map((img) => (
                                <motion.div
                                    key={img.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-surface rounded-xl overflow-hidden border border-gray-700 group hover:border-gray-500 transition-all"
                                >
                                    <div className="aspect-[3/4] overflow-hidden relative">
                                        <img
                                            src={`http://localhost:5000${img.image_url}`}
                                            alt={`Progress on ${img.date}`}
                                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                                            <div className="text-white font-bold text-lg">{img.weight} kg</div>
                                            <div className="text-gray-300 text-sm">{img.date}</div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {images.length === 0 && (
                                <div className="col-span-2 text-center text-gray-500 py-10">
                                    No progress photos yet. Start your journey today!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Progress;
