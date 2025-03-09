import React, { useState } from 'react'

const Profile = () => {
    const [profile, setProfile] = useState({
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://via.placeholder.com/150',
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
        <div className="min-h-screen bg-gray-100 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-6">
                        <div className="flex items-center">
                            <img
                                src={profile.avatar}
                                alt="Profile"
                                className="w-20 h-20 rounded-full object-cover"
                            />
                            <div className="ml-6 flex-1">
                                {isEditing ? (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Name</label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Email</label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            />
                                        </div>
                                        <div className="flex space-x-4">
                                            <button
                                                type="submit"
                                                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
                                        <p className="text-gray-600">{profile.email}</p>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="mt-2 text-indigo-600 hover:text-indigo-800"
                                        >
                                            Edit Profile
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
                    <div className="space-y-6">
                        {profile.orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div>
                                            <p className="text-sm text-gray-600">Order #{order.id}</p>
                                            <p className="text-sm text-gray-600">{order.date}</p>
                                        </div>
                                        <div>
                                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-200 pt-4">
                                        {order.items.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center py-2">
                                                <div>
                                                    <p className="font-medium">{item.title}</p>
                                                    <p className="text-sm text-gray-600">Quantity: {item.qty}</p>
                                                </div>
                                                <p className="font-medium">${(item.price * item.qty).toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="border-t border-gray-200 pt-4 mt-4">
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">Total</span>
                                            <span className="font-bold">${order.total.toFixed(2)}</span>
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