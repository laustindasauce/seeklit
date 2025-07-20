/* eslint-disable import/no-unresolved */
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { localApi } from "@/lib/localApi";
import { isSensitiveKey } from "@/lib/utils";
import { AlertTriangleIcon, EyeIcon, EyeOffIcon, SaveIcon } from "lucide-react";
import React from "react";

interface AdminConfigurationProps {
  config: ServerConfig;
  setConfig: React.Dispatch<React.SetStateAction<ServerConfig>>;
  userToken: string;
}

export default function AdminConfiguration({
  config,
  setConfig,
  userToken,
}: AdminConfigurationProps) {
  const [visibleSecrets, setVisibleSecrets] = React.useState<
    Record<string, boolean>
  >({});
  const [originalConfig, setOriginalConfig] =
    React.useState<ServerConfig>(config);
  const [modifiedFields, setModifiedFields] = React.useState<
    Record<string, boolean>
  >({});
  const { toast } = useToast();

  // Initialize original config only once when component mounts
  React.useEffect(() => {
    setOriginalConfig(config);
  }, []); // Empty dependency array - only run once on mount

  const handleConfigChange = (section: string, key: string, value: string) => {
    setConfig((prevConfig) => ({
      ...prevConfig,
      [section]: {
        ...prevConfig[section],
        [key]: value,
      },
    }));

    // Track if this field has been modified
    const fieldKey = `${section}.${key}`;
    const originalValue = originalConfig[section]?.[key];
    const isModified = value !== originalValue;

    setModifiedFields((prev) => ({
      ...prev,
      [fieldKey]: isModified,
    }));
  };

  const handleSaveConfig = async (
    section: string,
    key: string,
    value: string
  ) => {
    try {
      const configKey = `${section}::${key}`;

      await localApi.updateServerConfig(userToken, {
        key: configKey,
        value,
      });

      // Update original config and reset modified state for this field
      const fieldKey = `${section}.${key}`;
      setOriginalConfig((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [key]: value,
        },
      }));

      setModifiedFields((prev) => ({
        ...prev,
        [fieldKey]: false,
      }));

      toast({
        title: `Config (${configKey}) updated`,
      });
    } catch (error) {
      console.error("Error updating config:", error);
      toast({
        title: "Error",
        description: "Something went wrong updating config. Check the logs.",
      });
    }
  };

  const toggleSecretVisibility = (section: string, key: string) => {
    setVisibleSecrets((prev) => ({
      ...prev,
      [`${section}.${key}`]: !prev[`${section}.${key}`],
    }));
  };

  const renderConfigInput = (section: string, key: string, value: string) => {
    const isSecret = isSensitiveKey(key);
    const isVisible = visibleSecrets[`${section}.${key}`];
    const fieldKey = `${section}.${key}`;
    const isModified = modifiedFields[fieldKey] || false;

    return (
      <div key={key} className="mb-4 flex items-center">
        <Label htmlFor={`${section}-${key}`} className="w-1/3">
          {key}
        </Label>
        <div className="w-1/2 mr-2 flex">
          <Input
            id={`${section}-${key}`}
            type={isSecret && !isVisible ? "password" : "text"}
            value={value}
            onChange={(e) => handleConfigChange(section, key, e.target.value)}
            className="flex-grow input-styled"
          />
          {isSecret && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => toggleSecretVisibility(section, key)}
              className="ml-2"
            >
              {isVisible ? (
                <EyeOffIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
        {isModified && (
          <Button
            onClick={() => handleSaveConfig(section, key, config[section][key])}
          >
            <SaveIcon className="h-4 w-4 mr-2" />
            Save
          </Button>
        )}
      </div>
    );
  };

  const renderConfigSection = (
    section: string,
    data: Record<string, string>
  ) => (
    <Card className="mb-4" key={section}>
      <CardHeader>
        <CardTitle>
          {section.charAt(0).toUpperCase() + section.slice(1)} Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.entries(data).map(([key, value]) =>
          renderConfigInput(section, key, value)
        )}
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Configuration</CardTitle>
        <CardDescription>Manage server configuration settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-900">
          <AlertTriangleIcon className="h-4 w-4" color="#78350f" />
          <AlertTitle className="text-amber-900 font-semibold">
            Warning
          </AlertTitle>
          <AlertDescription className="text-amber-800">
            Changing these settings could potentially break the application.
            Some changes may require a server restart to take effect. Proceed
            with caution.
          </AlertDescription>
        </Alert>
        {Object.entries(config).map(([section, data]) =>
          renderConfigSection(section, data)
        )}
      </CardContent>
    </Card>
  );
}
