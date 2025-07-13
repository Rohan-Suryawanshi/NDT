import { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BACKEND_URL } from "@/constant/Global";

const ServiceProviderProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        const res = await axios.get(
           `${BACKEND_URL}/api/v1/service-provider/profile`,
           {
              headers: {
                 Authorization: `Bearer ${accessToken}`,
              },
           }
        );
        setProfile(res.data?.data);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading...</p>;
  if (!profile) return <p className="text-center mt-10 text-red-500">No profile data found.</p>;

  const {
    companyLogoUrl,
    companyName,
    contactNumber,
    businessLocation,
    companyDescription,
    companySpecialization,
    certificates,
    services,
    skillMatrix,
    personnelQualifications,
    companyCertifications,
    proceduresUrl,
    userId,
  } = profile;

  return (
    <section className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-6">
        {companyLogoUrl && (
          <img
            src={companyLogoUrl}
            alt="Company Logo"
            className="w-20 h-20 rounded-md object-cover border"
          />
        )}
        <div>
          <h2 className="text-2xl font-bold text-blue-600">{companyName}</h2>
          <p className="text-gray-600">{businessLocation}</p>
          <p className="text-gray-500 text-sm">{contactNumber}</p>
        </div>
      </div>

      {/* About */}
      <Card>
        <CardHeader>
          <CardTitle>About the Company</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-700 space-y-2">
          {companyDescription && <p>{companyDescription}</p>}
          {proceduresUrl && (
            <p>
              <strong>Procedures File: </strong>
              <a
                href={proceduresUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View
              </a>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Services */}
      {services?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Services Offered</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm border rounded-lg">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-2">Service ID</th>
                  <th className="p-2">Unit</th>
                  <th className="p-2">Quantity</th>
                  <th className="p-2">Price</th>
                  <th className="p-2">Currency</th>
                </tr>
              </thead>
              <tbody>
                {services.map((s, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2">{s.serviceId}</td>
                    <td className="p-2">{s.unit}</td>
                    <td className="p-2">{s.quantity}</td>
                    <td className="p-2">${s.price}</td>
                    <td className="p-2">{s.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {skillMatrix?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skill Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {skillMatrix.map((skill, i) => (
                <li key={i}>
                  {skill.skill} -{" "}
                  {skill.level === 1
                    ? "Beginner"
                    : skill.level === 2
                    ? "Intermediate"
                    : "Expert"}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Personnel Qualifications */}
      {personnelQualifications?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Personnel Qualifications</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {personnelQualifications.map((q, i) => (
                <li key={i}>
                  {q.certificationBody} - Level {q.level}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Certifications */}
      {companyCertifications?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Company Certifications</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {companyCertifications.map((cert, i) => (
              <Badge key={i} variant="outline">
                {cert}
              </Badge>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Certificates */}
      {certificates && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Certificates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {certificates.twic && (
              <div>
                <strong>TWIC: </strong>
                {certificates.twic.fileUrl ? (
                  <>
                    <a
                      href={certificates.twic.fileUrl}
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      View File
                    </a>
                    {certificates.twic.expiryDate && (
                      <span className="text-gray-500 ml-2">
                        (Expires:{" "}
                        {new Date(certificates.twic.expiryDate).toLocaleDateString()}
                        )
                      </span>
                    )}
                  </>
                ) : (
                  "Not uploaded"
                )}
              </div>
            )}
            {certificates.gatePass && (
              <div>
                <strong>Gate Pass: </strong>
                {certificates.gatePass.fileUrl ? (
                  <>
                    <a
                      href={certificates.gatePass.fileUrl}
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      View File
                    </a>
                    {certificates.gatePass.expiryDate && (
                      <span className="text-gray-500 ml-2">
                        (Expires:{" "}
                        {new Date(certificates.gatePass.expiryDate).toLocaleDateString()}
                        )
                      </span>
                    )}
                  </>
                ) : (
                  "Not uploaded"
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  );
};

export default ServiceProviderProfile;
