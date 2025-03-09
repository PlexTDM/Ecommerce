import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
const Search = () => {

    const navigate = useNavigate()
    const [search, setSearch] = useState('')
    const [dropdown, setDropdown] = useState(false)
    const searchRef = useRef(null)

    const handelSearch = (e) => {
        e.preventDefault()
        navigate({
            pathname: '/products',
            search: `?q=${search}`
        })
    }

    const handleBtn = (e) => {
        e.preventDefault()
        setDropdown(false)
        navigate(`/products/?tags=${e.target.value}`)
    }

    window.addEventListener('click', (e) => {
        if (searchRef.current && !searchRef.current.contains(e.target)) {
            setDropdown(false)
        }
    })


    return (
        <form className="max-w-lg mx-auto px-4 overflow-visible" ref={searchRef}>
            <div className="flex relative">
                <label htmlFor="search-dropdown" className="mb-2 text-lg font-medium text-gray-900 sr-only">Your Email</label>
                <button onClick={() => setDropdown(!dropdown)} className="shrink-0 z-10 cursor-pointer inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-s-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100" type="button">
                    <p>All categories</p>
                    <svg className="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 4 4 4-4" />
                    </svg>
                </button>

                <div className={`${!dropdown && 'hidden'} z-[60] absolute top-full mt-2 bg-white rounded-lg shadow-sm w-44 border-y border-gray-300 overflow-hidden`}>
                    <ul className="text-lg text-gray-700 divide-y **:cursor-pointer divide-gray-300 *:inline-flex *:w-full *:px-4 *:py-2 *:hover:bg-gray-100">
                        <li>
                            <button type="button" onClick={handleBtn} value={'Chibi Figures'}>Chibi Figures</button>
                        </li>
                        <li>
                            <button type="button" onClick={handleBtn} value={'Nendoroid'}>Nendoroid & Mini Figures</button>
                        </li>
                        <li>
                            <button type="button" onClick={handleBtn} value={'Scale Figures'}>Scale Figures</button>
                        </li>
                        <li>
                            <button type="button" onClick={handleBtn} value={'Action Figures'}>Action Figures</button>
                        </li>
                    </ul>
                </div>

                <div className="relative w-full">
                    <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} name="search" className="block p-2.5 w-full z-20 text-base text-gray-900 bg-gray-50 rounded-e-lg border-s-gray-50 border-s-2 border border-gray-300 focus:ring-blue-500 focus:border-blue-500" placeholder="Search" required />
                    <button type="submit" onClick={handelSearch} className="absolute top-0 end-0 p-2.5 text-base font-medium h-full text-white bg-blue-700 rounded-e-lg border border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300">
                        <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                        </svg>
                    </button>
                </div>
            </div>
        </form>

    )
}

export default Search