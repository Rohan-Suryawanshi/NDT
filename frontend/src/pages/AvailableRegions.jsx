import { Location } from "@/constant/Location";

export default function AvailableRegions() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#004aad] mb-4">
            Available Countries & Currencies
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We currently support services in the following countries and regions. 
            Each location includes local currency support for seamless transactions.
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-[#004aad] mb-2">
              {Location.length}
            </div>
            <div className="text-gray-600">Total Countries</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-[#004aad] mb-2">
              {new Set(Location.map(loc => loc.currencyCode)).size}
            </div>
            <div className="text-gray-600">Unique Currencies</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-3xl font-bold text-[#004aad] mb-2">
              {Location.filter(loc => loc.country.includes("United")).length}
            </div>
            <div className="text-gray-600">Major Markets</div>
          </div>
        </div>

        {/* Countries List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-[#004aad] text-white px-6 py-4">
            <h2 className="text-xl font-semibold">Supported Countries & Currencies</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Country/Region
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Currency Code
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Currency Name
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Location.map((location, index) => (
                  <tr 
                    key={location.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {location.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {location.country}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#004aad] text-white">
                        {location.currencyCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {location.currencyName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      
        {/* Footer Note */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Expanding Our Reach
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  We're continuously working to expand our service coverage to more countries and regions. 
                  If your country is not listed here, please contact our support team for updates on availability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}