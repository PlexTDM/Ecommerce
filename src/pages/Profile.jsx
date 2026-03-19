import { useState } from 'react'

const Profile = () => {
    const [profile, setProfile] = useState({
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300',
        orders: [
            {
                id: '1',
                date: '2024-02-20',
                total: 57.98,
                status: 'Delivered',
                items: [
                    {
                        title: "Dollel Figure Collection 2 Box Set",
                        qty: 2,
                        price: 28.99
                    }
                ]
            }
        ]
    })

    const [isEditing, setIsEditing] = useState(false)
    const [formData, setFormData] = useState({
        name: profile.name,
        email: profile.email
    })

    const handleSubmit = (e) => {
        e.preventDefault()
        setProfile({
            ...profile,
            ...formData
        })
        setIsEditing(false)
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header Hero Area */}
            <div className="h-64 bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-b-3xl shadow-lg relative">
                <div className="absolute inset-0 bg-black/10 rounded-b-3xl"></div>
            </div>
            
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
                <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden tracking-tight border border-white/20">
                    <div className="p-8 sm:p-12">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start">
                            <div className="relative group">
                                <img
                                    src={profile.avatar}
                                    alt="Profile"
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 rounded-full ring-4 ring-indigo-500/30"></div>
                            </div>
                            <div className="mt-6 sm:mt-0 sm:ml-8 flex-1 text-center sm:text-left">
                                {isEditing ? (
                                    <form onSubmit={handleSubmit} className="space-y-4 max-w-md w-full">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700">Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border bg-gray-50"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border bg-gray-50"
                                            />
                                        </div>
                                        <div className="flex justify-center sm:justify-start space-x-4 pt-2">
                                            <button
                                                type="submit"
                                                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition shadow-md shadow-indigo-500/30"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <h2 className="text-3xl font-extrabold text-gray-900">{profile.name}</h2>
                                        <p className="text-gray-500 font-medium mt-1">{profile.email}</p>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="mt-5 inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors shadow-sm"
                                        >
                                            Edit Profile
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12">
                    <h3 className="text-2xl font-bold text-gray-900 mb-8 border-b border-gray-200 pb-4">Order History</h3>
                    <div className="space-y-6">
                        {profile.orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow ring-1 ring-gray-900/5 overflow-hidden">
                                <div className="p-6 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100">
                                    <div className="mb-4 sm:mb-0">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Order #{order.id}</p>
                                        <p className="text-gray-900 font-semibold mt-1">{order.date}</p>
                                    </div>
                                    <div>
                                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-800 ring-1 ring-inset ring-green-600/20 shadow-sm">
                                            {order.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    {order.items.map((item, index) => (
                                        <div key={index} className="flex justify-between items-center py-4 border-b border-gray-50 last:border-0 last:pb-0">
                                            <div>
                                                <p className="text-lg font-semibold text-gray-900">{item.title}</p>
                                                <p className="text-sm font-medium text-gray-500 mt-1">Quantity: {item.qty}</p>
                                            </div>
                                            <p className="text-lg font-bold text-gray-900">${(item.price * item.qty).toFixed(2)}</p>
                                        </div>
                                    ))}
                                    <div className="mt-4 pt-6 border-t border-gray-100 flex justify-end">
                                        <div className="flex items-center justify-between w-full sm:w-1/2 lg:w-1/3 text-lg">
                                            <span className="font-bold text-gray-500">Total</span>
                                            <span className="font-extrabold text-indigo-600 text-2xl">${order.total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile